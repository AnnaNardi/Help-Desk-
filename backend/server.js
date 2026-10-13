import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
    }
  }
}

loadEnv(path.join(root, '.env'))

const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || '127.0.0.1'
const webRoot = path.join(root, 'dist')
const jwtSecret = process.env.JWT_SECRET
const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase()
const adminPassword = process.env.INITIAL_ADMIN_PASSWORD
const poolConfig = { max: Number(process.env.PGPOOL_MAX || 10) }
if (process.env.DATABASE_URL) poolConfig.connectionString = process.env.DATABASE_URL
else Object.assign(poolConfig, {
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
})
if (process.env.PGSSL === 'true') poolConfig.ssl = { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false' }
const pool = new Pool(poolConfig)

const tables = {
  users: ['id', 'email', 'name', 'avatar', 'company', 'role', 'ativo', 'phone', 'theme', 'created', 'updated'],
  companies: ['id', 'razao_social', 'nome_fantasia', 'cnpj', 'telefone', 'email', 'endereco', 'cidade', 'uf', 'cep', 'responsavel', 'contrato_status', 'ativo', 'created', 'updated'],
  tickets: ['id', 'numero', 'company', 'requester', 'technician', 'title', 'description', 'priority', 'status', 'opened_at', 'scheduled_for', 'scheduled_note', 'closed_at', 'created', 'updated'],
  ticket_history: ['id', 'ticket', 'type', 'user', 'description', 'service_details', 'created', 'updated'],
  messages: ['id', 'ticket', 'user', 'text', 'created', 'updated'],
  preventivas: ['id', 'company', 'description', 'technician', 'scheduled_date', 'status', 'observations', 'completed_date', 'created', 'updated'],
  notifications: ['id', 'user', 'type', 'title', 'message', 'ticket', 'preventiva', 'read', 'created', 'updated'],
  activity_logs: ['id', 'user', 'action', 'entity_type', 'entity_id', 'details', 'created', 'updated'],
}

const relations = {
  users: { company: 'companies' },
  tickets: { company: 'companies', requester: 'users', technician: 'users' },
  ticket_history: { user: 'users' },
  messages: { user: 'users' },
  preventivas: { company: 'companies', technician: 'users' },
  notifications: { ticket: 'tickets', preventiva: 'preventivas' },
  activity_logs: { user: 'users' },
}

const columns = (table) => tables[table].map((c) => (c === 'user' ? '"user"' : c === 'read' ? 'read_flag' : c)).join(', ')
const id = () => crypto.randomBytes(12).toString('base64url').replace(/[-_]/g, 'a').slice(0, 15)
const now = () => new Date().toISOString()
const safeRecord = (table, row) => {
  if (!row) return null
  const result = { ...row }
  if (table === 'users') delete result.password_hash
  if (table === 'notifications') {
    result.read = Boolean(result.read_flag)
    delete result.read_flag
  }
  for (const key of ['created', 'updated', 'opened_at', 'scheduled_for', 'closed_at', 'scheduled_date', 'completed_date']) {
    if (result[key] instanceof Date) result[key] = result[key].toISOString()
  }
  return result
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

function verifyPassword(password, encoded) {
  const [, salt, expected] = String(encoded || '').split(':')
  if (!salt || !expected) return false
  const actual = crypto.scryptSync(password, salt, 64)
  return crypto.timingSafeEqual(actual, Buffer.from(expected, 'hex'))
}

function signToken(user) {
  const head = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8 })).toString('base64url')
  const data = `${head}.${body}`
  return `${data}.${crypto.createHmac('sha256', jwtSecret).update(data).digest('base64url')}`
}

function parseToken(token) {
  try {
    const [head, body, signature] = token.split('.')
    const data = `${head}.${body}`
    const expected = crypto.createHmac('sha256', jwtSecret).update(data).digest()
    const received = Buffer.from(signature, 'base64url')
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null
    return payload
  } catch { return null }
}

class HttpError extends Error {
  constructor(status, message, data = {}) { super(message); this.status = status; this.data = data }
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

async function bodyJson(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 1_000_000) throw new HttpError(413, 'O corpo da solicitação é muito grande.')
    chunks.push(chunk)
  }
  if (!chunks.length) return {}
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) }
  catch { throw new HttpError(400, 'Corpo JSON inválido.') }
}

async function currentUser(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const payload = parseToken(token)
  if (!payload) return null
  const { rows } = await pool.query(`SELECT ${columns('users')}, password_hash FROM users WHERE id = $1 AND ativo = TRUE`, [payload.sub])
  return safeRecord('users', rows[0])
}

function requireAuth(user) {
  if (!user) throw new HttpError(401, 'Faça login para continuar.')
}
function requireAdmin(user) {
  requireAuth(user)
  if (user.role !== 'Admin') throw new HttpError(403, 'Acesso permitido somente para administradores.')
}

function parseFilter(source) {
  if (!source) return () => true
  const tokens = source.match(/\s*(>=|<=|!=|&&|\|\||[()=<>~]|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|[A-Za-z_][A-Za-z0-9_]*|[^\s()&|=<>~]+)\s*/g)?.map((t) => t.trim()) || []
  let at = 0
  const peek = () => tokens[at]
  const take = () => tokens[at++]
  const value = (token) => {
    if (token === undefined) throw new HttpError(400, 'Filtro inválido.')
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) return token.slice(1, -1).replace(/\\([\\"'])/g, '$1')
    if (token === 'true') return true
    if (token === 'false') return false
    return token
  }
  function atom() {
    if (take() !== '(') throw new HttpError(400, 'Filtro inválido.')
    const result = or()
    if (take() !== ')') throw new HttpError(400, 'Filtro inválido.')
    return result
  }
  function condition() {
    if (peek() === '(') return atom()
    const field = take()
    const operator = take()
    const expected = value(take())
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(field) || !['=', '!=', '>', '<', '>=', '<=', '~'].includes(operator)) throw new HttpError(400, 'Filtro inválido.')
    return (row) => {
      const current = field === 'read' && row.read_flag !== undefined ? row.read_flag : row[field]
      if (operator === '=') return String(current ?? '') === String(expected)
      if (operator === '!=') return String(current ?? '') !== String(expected)
      if (operator === '~') return String(current ?? '').toLocaleLowerCase().includes(String(expected).toLocaleLowerCase())
      if (current instanceof Date) {
        const left = current.getTime()
        const right = new Date(String(expected)).getTime()
        if (!Number.isFinite(right)) return false
        if (operator === '>') return left > right
        if (operator === '<') return left < right
        if (operator === '>=') return left >= right
        return left <= right
      }
      if (operator === '>') return String(current ?? '') > String(expected)
      if (operator === '<') return String(current ?? '') < String(expected)
      if (operator === '>=') return String(current ?? '') >= String(expected)
      return String(current ?? '') <= String(expected)
    }
  }
  function and() {
    let left = condition()
    while (peek() === '&&') { take(); const right = condition(); const previous = left; left = (row) => previous(row) && right(row) }
    return left
  }
  function or() {
    let left = and()
    while (peek() === '||') { take(); const right = and(); const previous = left; left = (row) => previous(row) || right(row) }
    return left
  }
  const result = or()
  if (at !== tokens.length) throw new HttpError(400, 'Filtro inválido.')
  return result
}

async function rowAllowed(table, row, user) {
  if (!user) return false
  if (user.role === 'Admin') return true
  if (table === 'companies') return user.role === 'Tecnico' || row.id === user.company
  if (table === 'users') return user.role === 'Admin' || user.role === 'Tecnico' || row.id === user.id || (!!user.company && row.company === user.company)
  if (table === 'tickets') return user.role === 'Tecnico' || row.requester === user.id || (!!user.company && row.company === user.company)
  if (table === 'preventivas') return user.role === 'Tecnico' || (!!user.company && row.company === user.company)
  if (table === 'notifications') return row.user === user.id
  if (table === 'activity_logs') return false
  if (table === 'ticket_history' || table === 'messages') {
    const ticket = await pool.query('SELECT requester, company FROM tickets WHERE id = $1', [row.ticket])
    const t = ticket.rows[0]
    return !!t && (user.role === 'Tecnico' || t.requester === user.id || (!!user.company && t.company === user.company))
  }
  return false
}

function inputRecord(table, data) {
  const accepted = tables[table].filter((field) => !['id', 'created', 'updated'].includes(field))
  const result = {}
  for (const field of accepted) if (data[field] !== undefined) result[field] = data[field]
  if (table === 'notifications' && result.read !== undefined) {
    result.read_flag = result.read
    delete result.read
  }
  for (const key of ['details', 'service_details']) {
    if (result[key] !== undefined && result[key] !== null) result[key] = JSON.stringify(result[key])
  }
  return result
}

async function expandRecords(table, rows, expand) {
  const names = (expand || '').split(',').map((x) => x.trim()).filter(Boolean)
  const result = []
  for (const source of rows) {
    const row = safeRecord(table, source)
    const allowed = relations[table] || {}
    for (const name of names) {
      const target = allowed[name]
      if (!target || !row[name]) continue
      const related = await pool.query(`SELECT ${columns(target)} FROM ${target} WHERE id = $1`, [row[name]])
      row.expand ||= {}
      row.expand[name] = safeRecord(target, related.rows[0])
    }
    result.push(row)
  }
  return result
}

async function createRecord(table, data, user) {
  if (table === 'users') requireAdmin(user)
  else if (table === 'companies') requireAdmin(user)
  else if (table === 'tickets') requireAuth(user)
  else if (table === 'preventivas') {
    requireAuth(user)
    if (!['Admin', 'Tecnico'].includes(user.role)) throw new HttpError(403, 'Somente a equipe de TI pode cadastrar preventivas.')
  } else if (table === 'messages') requireAuth(user)
  else if (table === 'ticket_history') requireAuth(user)
  else if (table === 'notifications') requireAdmin(user)
  else if (table === 'activity_logs') requireAuth(user)

  const record = inputRecord(table, data)
  if (table === 'users') {
    if (!record.email || !data.password || data.password.length < 8) throw new HttpError(400, 'E-mail e senha de pelo menos 8 caracteres são obrigatórios.', { email: { message: 'E-mail e senha são obrigatórios.' } })
    if (data.passwordConfirm && data.password !== data.passwordConfirm) throw new HttpError(400, 'As senhas não coincidem.')
    record.email = String(record.email).trim().toLowerCase()
    record.password_hash = hashPassword(data.password)
    record.role ||= 'Usuario'
    record.ativo = Boolean(record.ativo)
    record.theme ||= 'claro'
  }
  if (table === 'tickets') {
    if (user.role === 'Usuario') {
      record.requester = user.id
      record.company = user.company || null
    }
    if (!record.numero || record.numero === 'AUTO') {
      const top = await pool.query("SELECT setval('ticket_number_seq', GREATEST((SELECT last_value FROM ticket_number_seq), COALESCE((SELECT MAX(NULLIF(regexp_replace(numero, '[^0-9]', '', 'g'), '')::BIGINT) FROM tickets), 1000)), true) AS current")
      const next = await pool.query("SELECT nextval('ticket_number_seq') AS next")
      record.numero = `#${next.rows[0].next}`
    }
    record.opened_at ||= now()
    record.status ||= 'Aberto'
  }
  if (table === 'messages') {
    record.user = user.id
  }
  if (table === 'messages' || table === 'ticket_history') {
    const ticket = (await pool.query('SELECT * FROM tickets WHERE id=$1', [record.ticket])).rows[0]
    if (!ticket || !(await rowAllowed('tickets', ticket, user))) throw new HttpError(403, 'Sem permissão para registrar atividade neste chamado.')
  }
  if (table === 'ticket_history' || table === 'activity_logs') record.user = user.id
  const fields = Object.keys(record)
  const values = fields.map((field) => record[field])
  const cols = ['id', ...fields].map((c) => c === 'user' ? '"user"' : c === 'read_flag' ? 'read_flag' : c).join(', ')
  const params = [`$1`, ...values.map((_, i) => `$${i + 2}`)]
  const insertValues = [id(), ...values]
  try {
    const { rows } = await pool.query(`INSERT INTO ${table} (${cols}) VALUES (${params.join(', ')}) RETURNING *`, insertValues)
    const saved = rows[0]
    if (table === 'tickets') await ticketCreated(saved, user)
    if (table === 'messages') await messageCreated(saved, user)
    if (table === 'preventivas') await preventivaCreated(saved, user)
    return safeRecord(table, saved)
  } catch (error) {
    if (error.code === '23505') throw new HttpError(400, 'Já existe um registro com esses dados.')
    if (error.code === '23503') throw new HttpError(400, 'Selecione uma empresa ou usuário válido.')
    throw error
  }
}

async function writeLog(userId, action, type, entityId, details = {}) {
  await pool.query('INSERT INTO activity_logs (id, "user", action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5,$6)', [id(), userId || null, action, type || null, entityId || null, JSON.stringify(details)])
}

async function writeNotification(userId, type, title, message, ticket = null, preventiva = null) {
  if (!userId) return
  await pool.query('INSERT INTO notifications (id, "user", type, title, message, ticket, preventiva) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id(), userId, type, title, message, ticket, preventiva])
}

async function writeHistory(ticket, type, userId, description, serviceDetails) {
  await pool.query('INSERT INTO ticket_history (id, ticket, type, "user", description, service_details) VALUES ($1,$2,$3,$4,$5,$6)', [id(), ticket, type, userId || null, description || null, serviceDetails ? JSON.stringify(serviceDetails) : null])
}

async function ticketCreated(ticket, user) {
  await writeHistory(ticket.id, 'create', ticket.requester, `Chamado aberto: ${ticket.title}`)
  await writeLog(ticket.requester, 'ticket_create', 'ticket', ticket.id, { numero: ticket.numero, title: ticket.title, priority: ticket.priority, technician: ticket.technician })
  if (ticket.technician) await writeNotification(ticket.technician, 'ticket_assigned', `Novo chamado atribuído ${ticket.numero}`, `Você foi designado como responsável pelo chamado: ${ticket.title}`, ticket.id)
  const admins = await pool.query("SELECT id FROM users WHERE role='Admin' AND ativo=true")
  for (const admin of admins.rows) if (admin.id !== ticket.requester && admin.id !== ticket.technician) await writeNotification(admin.id, 'ticket_created', `Novo chamado aberto: ${ticket.numero}`, `Chamado aberto: ${ticket.title}`, ticket.id)
  await emit({ collection: 'tickets', action: 'create', record: safeRecord('tickets', ticket) })
}

async function messageCreated(message, user) {
  await writeHistory(message.ticket, 'message', user.id, 'Mensagem adicionada ao atendimento.')
  const ticket = (await pool.query('SELECT requester, technician, numero FROM tickets WHERE id=$1', [message.ticket])).rows[0]
  for (const target of new Set([ticket?.requester, ticket?.technician])) if (target && target !== user.id) await writeNotification(target, 'ticket_message', `Nova mensagem no chamado ${ticket.numero}`, 'Uma nova mensagem foi adicionada ao chamado.', message.ticket)
  await emit({ collection: 'messages', action: 'create', record: safeRecord('messages', message) })
}

async function preventivaCreated(record, user) {
  await writeNotification(record.technician, 'preventiva_created', 'Nova Preventiva Agendada', `Preventiva atribuída a você para ${String(record.scheduled_date).slice(0, 10)}: ${record.description.slice(0, 80)}`, null, record.id)
  await writeLog(user.id, 'preventiva_create', 'preventiva', record.id, { description: record.description, scheduled_date: record.scheduled_date })
  await emit({ collection: 'preventivas', action: 'create', record: safeRecord('preventivas', record) })
}

async function updateRecord(table, recordId, data, user) {
  requireAuth(user)
  if (table === 'users' && user.role !== 'Admin' && recordId !== user.id) throw new HttpError(403, 'Sem permissão para alterar este usuário.')
  if (['companies', 'activity_logs'].includes(table)) requireAdmin(user)
  if (table === 'tickets' && !['Admin', 'Tecnico'].includes(user.role)) {
    const current = (await pool.query('SELECT requester, status FROM tickets WHERE id=$1', [recordId])).rows[0]
    if (!current || current.requester !== user.id || current.status === 'Fechado') throw new HttpError(403, 'Sem permissão para alterar este chamado.')
    const allowed = new Set(['status'])
    for (const key of Object.keys(data)) if (!allowed.has(key)) delete data[key]
  }
  if (table === 'preventivas' && !['Admin', 'Tecnico'].includes(user.role)) throw new HttpError(403, 'Somente a equipe de TI pode alterar preventivas.')
  if (table === 'activity_logs') throw new HttpError(403, 'Os registros de auditoria não podem ser alterados.')
  const before = (await pool.query(`SELECT * FROM ${table} WHERE id=$1`, [recordId])).rows[0]
  if (!before) throw new HttpError(404, 'Registro não encontrado.')
  if (!(await rowAllowed(table, before, user))) throw new HttpError(403, 'Sem permissão para acessar este registro.')
  const record = inputRecord(table, data)
  if (table === 'users' && user.role !== 'Admin') {
    const allowed = new Set(['name', 'email', 'avatar', 'phone', 'theme', 'password_hash'])
    for (const key of Object.keys(record)) if (!allowed.has(key)) delete record[key]
  }
  if (table === 'users' && user.role === 'Admin' && recordId === user.id && record.role && record.role !== 'Admin') throw new HttpError(400, 'Não é possível remover o seu próprio acesso de administrador.')
  if (table === 'users' && data.password) {
    if (data.password.length < 8) throw new HttpError(400, 'A senha deve ter pelo menos 8 caracteres.')
    if (data.passwordConfirm && data.password !== data.passwordConfirm) throw new HttpError(400, 'As senhas não coincidem.')
    if (recordId === user.id && user.role !== 'Admin' || (recordId === user.id && data.oldPassword)) {
      const current = (await pool.query('SELECT password_hash FROM users WHERE id=$1', [recordId])).rows[0]
      if (!data.oldPassword || !verifyPassword(data.oldPassword, current?.password_hash)) throw new HttpError(401, 'A senha atual está incorreta.')
    }
    record.password_hash = hashPassword(data.password)
  }
  if (table === 'tickets' && data.status === 'Fechado' && before.status !== 'Fechado') record.closed_at = now()
  if (table === 'tickets' && data.status && data.status !== 'Fechado' && before.status === 'Fechado') record.closed_at = null
  const fields = Object.keys(record)
  if (!fields.length) return safeRecord(table, before)
  const values = fields.map((field) => record[field])
  const set = fields.map((field, i) => `${field === 'user' ? '"user"' : field}=$${i + 2}`).concat('updated=NOW()').join(', ')
  const { rows } = await pool.query(`UPDATE ${table} SET ${set} WHERE id=$1 RETURNING *`, [recordId, ...values])
  const saved = rows[0]
  if (table === 'tickets') await ticketUpdated(before, saved, user)
  await emit({ collection: table, action: 'update', record: safeRecord(table, saved) })
  return safeRecord(table, saved)
}

async function ticketUpdated(before, after, user) {
  if (before.technician !== after.technician) {
    await writeHistory(after.id, 'assign', user.id, 'Técnico responsável alterado.')
    if (after.technician) await writeNotification(after.technician, 'ticket_assigned', `Chamado atribuído: ${after.numero}`, `Você foi designado para o chamado: ${after.title}`, after.id)
    if (before.technician) await writeNotification(before.technician, 'ticket_unassigned', `Chamado redistribuído: ${after.numero}`, `O chamado ${after.numero} foi atribuído a outro técnico.`, after.id)
  }
  if (before.priority !== after.priority) await writeHistory(after.id, 'priority_change', user.id, `Prioridade alterada de ${before.priority} para ${after.priority}.`)
  if (before.status !== after.status) {
    const kind = after.status === 'Fechado' ? 'close' : before.status === 'Fechado' && after.status === 'Aberto' ? 'reopen' : after.status === 'Agendado' ? 'schedule' : 'status_change'
    await writeHistory(after.id, kind, user.id, `Status alterado de ${before.status} para ${after.status}.`)
    await writeNotification(after.requester, 'ticket_status', `Chamado ${after.numero}: ${after.status}`, `O status do seu chamado foi atualizado para ${after.status}`, after.id)
    if (after.technician && after.technician !== after.requester) await writeNotification(after.technician, 'ticket_status', `Chamado ${after.numero}: ${after.status}`, `Status atualizado para: ${after.status}`, after.id)
  }
  await writeLog(user.id, 'ticket_update', 'ticket', after.id, { status: after.status, priority: after.priority })
}

async function deleteRecord(table, recordId, user) {
  requireAuth(user)
  if (table === 'users' && user.role !== 'Admin') throw new HttpError(403, 'Somente administradores podem remover usuários.')
  if (table === 'users' && recordId === user.id) throw new HttpError(400, 'Não é possível remover o usuário administrador conectado.')
  if (['companies', 'tickets', 'preventivas'].includes(table)) requireAdmin(user)
  if (table === 'notifications') {
    const row = (await pool.query('SELECT "user" FROM notifications WHERE id=$1', [recordId])).rows[0]
    if (!row || (user.role !== 'Admin' && row.user !== user.id)) throw new HttpError(403, 'Sem permissão para excluir esta notificação.')
  }
  const { rowCount } = await pool.query(`DELETE FROM ${table} WHERE id=$1`, [recordId])
  if (!rowCount) throw new HttpError(404, 'Registro não encontrado.')
  await emit({ collection: table, action: 'delete', record: { id: recordId } })
  return true
}

const listeners = new Set()
function emit(event) {
  for (const listener of listeners) listener(event)
}

async function requestPasswordTicket(email) {
  const generic = { success: true, exists: false, message: 'Se o e-mail estiver cadastrado e ativo, a solicitação foi registrada para a equipe de T.I.' }
  const result = await pool.query('SELECT id,email,name,phone,company,ativo FROM users WHERE lower(email)=lower($1)', [email])
  const user = result.rows[0]
  if (!user || !user.ativo) return generic
  let company = user.company
  if (!company) company = (await pool.query('SELECT id FROM companies ORDER BY created LIMIT 1')).rows[0]?.id
  if (!company) return generic
  const existing = await pool.query("SELECT numero FROM tickets WHERE requester=$1 AND status <> 'Fechado' AND title ILIKE '%Redefinição de senha%' ORDER BY created DESC LIMIT 1", [user.id])
  if (existing.rowCount) return { success: true, exists: true, alreadyOpen: true, ticketNumero: existing.rows[0].numero, message: `Já existe uma solicitação em andamento (${existing.rows[0].numero}).` }
  const ticket = await createRecord('tickets', { company, requester: user.id, title: `Solicitação de redefinição de senha — ${user.name || 'Usuário'}`, description: `Solicitação automática de redefinição de senha.\nE-mail: ${user.email}\nTelefone: ${user.phone || 'Não informado'}`, priority: 'Média', status: 'Aberto', numero: 'AUTO' }, { id: user.id, role: 'Usuario', company })
  return { success: true, exists: true, ticketNumero: ticket.numero, message: 'Solicitação registrada para a equipe de T.I.' }
}

async function customRoute(req, pathname, user) {
  if (pathname === '/backend/v1/custom/password-reset-request' && req.method === 'POST') {
    const body = await bodyJson(req)
    return requestPasswordTicket(String(body.email || '').trim())
  }
  if (pathname === '/backend/v1/custom/admin-reset-password' && req.method === 'POST') {
    requireAdmin(user)
    const body = await bodyJson(req)
    if (!body.userId || !body.password || body.password.length < 8) throw new HttpError(400, 'Informe usuário e senha com pelo menos 8 caracteres.')
    const target = await updateRecord('users', body.userId, { password: body.password }, user)
    await writeNotification(target.id, 'password_reset_by_admin', 'Sua senha foi redefinida', 'Um administrador redefiniu sua senha. Entre em contato com o suporte para receber a nova credencial.', body.ticketId || null)
    await writeLog(user.id, 'user_password_reset', 'user', target.id, { ticket_id: body.ticketId || null })
    if (body.ticketId) await writeHistory(body.ticketId, 'service', user.id, `Senha de acesso redefinida pelo administrador ${user.name || user.email}.`)
    return { success: true, message: 'Senha redefinida com sucesso.' }
  }
  throw new HttpError(404, 'Endpoint não encontrado.')
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const pathname = url.pathname
  const user = await currentUser(req)

  if (req.method === 'GET' && pathname === '/api/health') return send(res, 200, { status: 'ok' })
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await bodyJson(req)
    const { rows } = await pool.query('SELECT *, password_hash FROM users WHERE lower(email)=lower($1)', [String(body.email || '').trim()])
    const account = rows[0]
    if (!account || !account.ativo || !verifyPassword(String(body.password || ''), account.password_hash)) throw new HttpError(401, 'E-mail ou senha inválidos.')
    await writeLog(account.id, 'login', 'user', account.id, { email: account.email })
    const record = safeRecord('users', account)
    return send(res, 200, { token: signToken(record), record })
  }
  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    if (user) await writeLog(user.id, 'logout', 'user', user.id, { email: user.email })
    return send(res, 200, { success: true })
  }
  if (pathname === '/api/auth/email' && req.method === 'PUT') {
    requireAuth(user)
    const body = await bodyJson(req)
    if (!String(body.email || '').includes('@')) throw new HttpError(400, 'Informe um e-mail válido.')
    try {
      const { rows } = await pool.query('UPDATE users SET email=lower($1),updated=NOW() WHERE id=$2 RETURNING *', [body.email.trim(), user.id])
      return send(res, 200, { success: true, record: safeRecord('users', rows[0]) })
    } catch (error) {
      if (error.code === '23505') throw new HttpError(409, 'Este e-mail já está em uso.')
      throw error
    }
  }
  if (pathname === '/api/auth/confirm-email' && req.method === 'POST') throw new HttpError(410, 'O link de confirmação antigo não é mais válido. Altere o e-mail nas configurações após entrar no sistema.')
  if (pathname === '/api/auth/reset-password' && req.method === 'POST') throw new HttpError(410, 'A redefinição por link não está configurada. Use a opção de abrir solicitação de suporte.')
  if (pathname.startsWith('/backend/v1/custom/')) return send(res, 200, await customRoute(req, pathname, user))

  const match = pathname.match(/^\/api\/collections\/([a-z_]+)\/records(?:\/([^/]+))?$/)
  const authMatch = pathname.match(/^\/api\/collections\/([a-z_]+)\/auth-with-password$/)
  if (authMatch && req.method === 'POST') {
    const body = await bodyJson(req)
    const { rows } = await pool.query('SELECT *, password_hash FROM users WHERE lower(email)=lower($1)', [String(body.identity || body.email || '').trim()])
    const account = rows[0]
    if (!account || !account.ativo || !verifyPassword(String(body.password || ''), account.password_hash)) throw new HttpError(401, 'E-mail ou senha inválidos.')
    const record = safeRecord('users', account)
    await writeLog(record.id, 'login', 'user', record.id, { email: record.email })
    return send(res, 200, { token: signToken(record), record })
  }
  if (!match || !tables[match[1]]) throw new HttpError(404, 'Endpoint não encontrado.')
  const table = match[1]
  const recordId = match[2]

  if (!recordId && req.method === 'GET') {
    requireAuth(user)
    let rows = (await pool.query(`SELECT * FROM ${table} ORDER BY created DESC LIMIT 2000`)).rows
    const filter = parseFilter(url.searchParams.get('filter'))
    const expanded = await expandRecords(table, rows, url.searchParams.get('expand'))
    const filtered = []
    for (let i = 0; i < rows.length; i++) if (await rowAllowed(table, rows[i], user) && filter(expanded[i])) filtered.push({ row: rows[i], value: expanded[i] })
    const sort = (url.searchParams.get('sort') || '-created').split(',')
    for (const item of sort.reverse()) {
      const desc = item.startsWith('-')
      const field = item.replace(/^-/, '')
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(field)) continue
      filtered.sort((a, b) => {
        const left = a.row[field] instanceof Date ? a.row[field].getTime() : String(a.row[field] ?? '')
        const right = b.row[field] instanceof Date ? b.row[field].getTime() : String(b.row[field] ?? '')
        const order = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'pt-BR')
        return order * (desc ? -1 : 1)
      })
    }
    const page = Math.max(1, Number(url.searchParams.get('page') || 1))
    const perPage = Math.min(200, Math.max(1, Number(url.searchParams.get('perPage') || 200)))
    const items = filtered.slice((page - 1) * perPage, page * perPage).map((item) => item.value)
    return send(res, 200, { page, perPage, totalItems: filtered.length, totalPages: Math.ceil(filtered.length / perPage), items })
  }
  if (recordId && req.method === 'GET') {
    requireAuth(user)
    const row = (await pool.query(`SELECT * FROM ${table} WHERE id=$1`, [recordId])).rows[0]
    if (!row) throw new HttpError(404, 'Registro não encontrado.')
    if (!(await rowAllowed(table, row, user))) throw new HttpError(403, 'Sem permissão para acessar este registro.')
    return send(res, 200, (await expandRecords(table, [row], url.searchParams.get('expand')))[0])
  }
  if (!recordId && req.method === 'POST') {
    requireAuth(user)
    const created = await createRecord(table, await bodyJson(req), user)
    return send(res, 201, created)
  }
  if (recordId && req.method === 'PATCH') {
    const updated = await updateRecord(table, recordId, await bodyJson(req), user)
    return send(res, 200, updated)
  }
  if (recordId && req.method === 'DELETE') {
    await deleteRecord(table, recordId, user)
    return send(res, 204, {})
  }
  throw new HttpError(405, 'Método não permitido.')
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': req.headers.origin || '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS' }); return res.end() }
    const origin = req.headers.origin
    if (origin && process.env.ALLOWED_ORIGIN && origin !== process.env.ALLOWED_ORIGIN) return send(res, 403, { message: 'Origem não autorizada.' })
    if (origin && !process.env.ALLOWED_ORIGIN) res.setHeader('access-control-allow-origin', origin)
    if (origin && process.env.ALLOWED_ORIGIN) res.setHeader('access-control-allow-origin', process.env.ALLOWED_ORIGIN)
    if (origin) res.setHeader('vary', 'Origin')
    const requestPath = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname
    if (!requestPath.startsWith('/api/') && !requestPath.startsWith('/backend/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Método não permitido.')
      const relative = decodeURIComponent(requestPath).replace(/^\/+/, '')
      let file = path.resolve(webRoot, relative || 'index.html')
      if (!file.startsWith(webRoot + path.sep) && file !== path.join(webRoot, 'index.html')) throw new HttpError(403, 'Acesso negado.')
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(webRoot, 'index.html')
      if (!fs.existsSync(file)) throw new HttpError(404, 'Interface não compilada. Rode npm run build.')
      const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2' }
      res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'x-content-type-options': 'nosniff' })
      return fs.createReadStream(file).pipe(res)
    }
    await route(req, res)
  } catch (error) {
    if (res.headersSent) return res.end()
    const status = error instanceof HttpError ? error.status : 500
    if (status === 500) console.error(error)
    send(res, status, { message: status === 500 ? 'Erro interno no servidor.' : error.message, data: error.data || {} })
  }
})

async function initialize() {
  if (!jwtSecret || jwtSecret.length < 32) throw new Error('Configure JWT_SECRET com pelo menos 32 caracteres no arquivo .env.')
  if (!process.env.DATABASE_URL && !(process.env.PGHOST && process.env.PGDATABASE && process.env.PGUSER)) throw new Error('Configure DATABASE_URL ou PGHOST, PGDATABASE e PGUSER no arquivo .env.')
  if (!adminPassword || adminPassword.length < 12) throw new Error('Configure INITIAL_ADMIN_PASSWORD com pelo menos 12 caracteres no arquivo .env.')
  await pool.query(fs.readFileSync(path.join(root, 'backend', 'schema.sql'), 'utf8'))
  await pool.query("SELECT setval('ticket_number_seq', GREATEST((SELECT last_value FROM ticket_number_seq), COALESCE((SELECT MAX(NULLIF(regexp_replace(numero, '[^0-9]', '', 'g'), '')::BIGINT) FROM tickets), 1000)), true)")
  const { rows } = await pool.query('SELECT id FROM users WHERE lower(email)=lower($1)', [adminEmail])
  if (!rows.length) {
    await pool.query('INSERT INTO users (id,email,password_hash,name,role,ativo,theme) VALUES ($1,$2,$3,$4,\'Admin\',TRUE,\'claro\')', [id(), adminEmail, hashPassword(adminPassword), process.env.INITIAL_ADMIN_NAME || 'Administrador do Sistema'])
    console.log(`Usuário administrador criado: ${adminEmail}`)
  }
}

initialize().then(() => {
  server.listen(port, host, () => console.log(`Help Desk API em http://${host}:${port}`))
}).catch((error) => {
  console.error(`Inicialização falhou: ${error.message}`)
  process.exitCode = 1
})

process.on('SIGINT', async () => { server.close(); await pool.end(); process.exit(0) })
process.on('SIGTERM', async () => { server.close(); await pool.end(); process.exit(0) })
