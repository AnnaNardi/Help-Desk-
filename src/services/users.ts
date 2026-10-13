import pb from '@/lib/api/client'
import { User } from '@/types/helpdesk'

export const userService = {
  async getAll(): Promise<User[]> {
    return await pb.collection('users').getFullList<User>({
      sort: 'name',
      expand: 'company',
    })
  },

  async getTechnicians(): Promise<User[]> {
    return await pb.collection('users').getFullList<User>({
      filter: "role = 'Tecnico' || role = 'Admin'",
      sort: 'name',
      expand: 'company',
    })
  },

  async getByCompany(companyId: string, onlyActive: boolean = true): Promise<User[]> {
    if (!companyId) return []
    const filter = onlyActive
      ? `company = "${companyId}" && ativo != false`
      : `company = "${companyId}"`
    return await pb.collection('users').getFullList<User>({
      filter,
      sort: 'name',
      expand: 'company',
    })
  },

  async getWithoutCompany(): Promise<User[]> {
    return await pb.collection('users').getFullList<User>({
      filter: 'company = "" && ativo != false',
      sort: 'name',
      expand: 'company',
    })
  },

  async getById(id: string): Promise<User> {
    return await pb.collection('users').getOne<User>(id, {
      expand: 'company',
    })
  },

  async create(data: {
    email: string
    password?: string
    passwordConfirm?: string
    name: string
    role: 'Admin' | 'Tecnico' | 'Usuario'
    company?: string
    phone?: string
    ativo?: boolean
  }): Promise<User> {
    return await pb.collection('users').create<User>({
      ...data,
      password: data.password || '',
      passwordConfirm: data.passwordConfirm || data.password || '',
      emailVisibility: true,
    })
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    return await pb.collection('users').update<User>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('users').delete(id)
  },

  async toggleActive(id: string, currentStatus: boolean): Promise<User> {
    return await pb.collection('users').update<User>(id, {
      ativo: !currentStatus,
    })
  },

  async adminResetPassword(
    userId: string,
    password: string,
    ticketId?: string,
  ): Promise<{ success: boolean; message: string; password?: string }> {
    return await pb.send('/backend/v1/custom/admin-reset-password', {
      method: 'POST',
      body: {
        userId,
        password,
        ticketId: ticketId || '',
      },
    })
  },

  async requestPasswordResetTicket(email: string): Promise<{
    success: boolean
    message: string
    exists?: boolean
    alreadyOpen?: boolean
    ticketNumero?: string
  }> {
    return await pb.send('/backend/v1/custom/password-reset-request', {
      method: 'POST',
      body: {
        email: email.trim(),
      },
    })
  },
}
