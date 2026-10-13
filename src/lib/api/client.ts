export type RecordModel = { id: string; created?: string; updated?: string; [key: string]: any }
export type RecordSubscription<T = RecordModel> = { action: 'create' | 'update' | 'delete'; record: T }
export type ClientResponse = { data?: Record<string, { message?: string }>; message?: string }
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export class ClientResponseError extends Error {
  response: ClientResponse
  status: number
  constructor(status: number, response: ClientResponse) {
    super(response.message || 'Não foi possível concluir a solicitação.')
    this.status = status
    this.response = response
  }
}

type RequestOptions = { filter?: string; sort?: string; expand?: string; page?: number; perPage?: number; limit?: number }

class AuthStore {
  token = ''
  record: RecordModel | null = null
  private listeners = new Set<() => void>()
  private storageKey = 'helpdesk_auth'

  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey) || 'null')
      if (saved?.token && saved?.record) {
        this.token = saved.token
        this.record = saved.record
      }
    } catch { /* use a fresh session */ }
  }

  get isValid() {
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      return !!this.record && payload.exp * 1000 > Date.now()
    } catch { return false }
  }

  save(token: string, record: RecordModel) {
    this.token = token
    this.record = record
    localStorage.setItem(this.storageKey, JSON.stringify({ token, record }))
    this.listeners.forEach((listener) => listener())
  }

  clear() {
    this.token = ''
    this.record = null
    localStorage.removeItem(this.storageKey)
    this.listeners.forEach((listener) => listener())
  }

  onChange(callback: () => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }
}

class Collection<T extends RecordModel = RecordModel> {
  constructor(private client: ApiClient, private name: string) {}
  private endpoint(id?: string) { return `/api/collections/${this.name}/records${id ? `/${encodeURIComponent(id)}` : ''}` }

  async getList<U = T>(page = 1, perPage = 30, options: RequestOptions = {}) {
    return this.client.request<{ page: number; perPage: number; totalItems: number; totalPages: number; items: U[] }>(`${this.endpoint()}?${this.client.query({ ...options, page, perPage })}`)
  }

  async getFullList<U = T>(options: RequestOptions = {}): Promise<U[]> {
    const { limit, ...listOptions } = options
    const pageSize = Math.min(200, limit || 200)
    const first = await this.getList<U>(1, pageSize, listOptions)
    const result = [...first.items]
    if (limit) return result.slice(0, limit)
    for (let page = 2; page <= first.totalPages; page++) result.push(...(await this.getList<U>(page, pageSize, listOptions)).items)
    return result
  }

  getOne<U = T>(id: string, options: RequestOptions = {}) {
    return this.client.request<U>(`${this.endpoint(id)}?${this.client.query(options)}`)
  }

  async getFirstListItem<U = T>(filter: string, options: RequestOptions = {}) {
    const result = await this.getList<U>(1, 1, { ...options, filter })
    if (!result.items.length) throw new ClientResponseError(404, { message: 'Registro não encontrado.' })
    return result.items[0]
  }

  create<U = T>(data: any): Promise<U> {
    return this.client.request<U>(this.endpoint(), { method: 'POST', body: data })
  }

  update<U = T>(id: string, data: any): Promise<U> {
    return this.client.request<U>(this.endpoint(id), { method: 'PATCH', body: data })
  }

  delete(id: string): Promise<boolean> {
    return this.client.request(this.endpoint(id), { method: 'DELETE' }).then(() => true)
  }

  async authWithPassword<U = T>(email: string, password: string) {
    const result = await this.client.request<{ token: string; record: U }>('/api/auth/login', { method: 'POST', body: { email, password } })
    this.client.authStore.save(result.token, result.record as RecordModel)
    return result
  }

  async subscribe(topic: string, callback: (event: RecordSubscription<T>) => void) {
    const unsubscribe = await this.client.subscribe(this.name, topic, callback)
    return unsubscribe
  }

  unsubscribe(topic = '*') { return this.client.unsubscribe(this.name, topic) }

  requestEmailChange(email: string) {
    return this.client.request('/api/auth/email', { method: 'PUT', body: { email } })
  }

  confirmEmailChange(token: string, password?: string) {
    return this.client.request('/api/auth/confirm-email', { method: 'POST', body: { token, password } })
  }

  confirmVerification(token: string) {
    return this.client.request('/api/auth/confirm-email', { method: 'POST', body: { token } })
  }

  confirmPasswordReset(token: string, password: string, passwordConfirm: string) {
    return this.client.request('/api/auth/reset-password', { method: 'POST', body: { token, password, passwordConfirm } })
  }
}

class ApiClient {
  authStore = new AuthStore()
  private subscriptions = new Map<string, { topic: string; timer: number; signature: string }[]>()
  autoCancellation(_enabled: boolean) { return this }

  collection<T extends RecordModel = RecordModel>(name: string) { return new Collection<T>(this, name) }

  query(options: RequestOptions) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(options)) if (value !== undefined && value !== '') params.set(key, String(value))
    return params.toString()
  }

  async request<T = unknown>(url: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
    const headers: Record<string, string> = {}
    if (this.authStore.token) headers.authorization = `Bearer ${this.authStore.token}`
    if (options.body !== undefined) headers['content-type'] = 'application/json'
    const response = await fetch(`${API_BASE}${url}`, { method: options.method || 'GET', headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) })
    const result = response.status === 204 ? null : await response.json()
    if (!response.ok) throw new ClientResponseError(response.status, result || {})
    return result as T
  }

  send<T = unknown>(url: string, options: { method?: string; body?: unknown } = {}) {
    return this.request<T>(url, options)
  }

  async subscribe<T extends RecordModel>(name: string, topic: string, callback: (event: RecordSubscription<T>) => void) {
    const collection = this.collection<T>(name)
    const load = async () => topic === '*' ? collection.getFullList({ sort: '-updated' }) : [await collection.getOne(topic)]
    let signature = ''
    try { signature = JSON.stringify(await load()) } catch { /* transient network error */ }
    const registration = { topic, signature, timer: 0 }
    const poll = async () => {
      try {
        const next = await load()
        const nextSignature = JSON.stringify(next)
        if (nextSignature !== registration.signature) {
          registration.signature = nextSignature
          const record = topic === '*' ? (next[0] as T | undefined) : next[0]
          if (record) callback({ action: 'update', record })
        }
      } catch { /* a later poll can recover */ }
    }
    registration.timer = window.setInterval(poll, 5000)
    this.subscriptions.set(name, [...(this.subscriptions.get(name) || []), registration])
    return async () => this.removeSubscription(name, registration)
  }

  async unsubscribe(name: string, topic = '*') {
    for (const subscription of [...(this.subscriptions.get(name) || [])]) {
      if (topic === '*' || subscription.topic === topic) this.removeSubscription(name, subscription)
    }
  }

  private removeSubscription(name: string, subscription: { topic: string; timer: number }) {
    window.clearInterval(subscription.timer)
    this.subscriptions.set(name, (this.subscriptions.get(name) || []).filter((item) => item !== subscription))
  }
}

const pb = new ApiClient()
export default pb
