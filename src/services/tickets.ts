import pb from '@/lib/api/client'
import { Ticket, TicketHistory, Message, TicketStatus, TicketPriority } from '@/types/helpdesk'

export interface TicketFilterOptions {
  company?: string
  technician?: string
  requester?: string
  status?: string
  priority?: string
  search?: string
  startDate?: string
  endDate?: string
  page?: number
  perPage?: number
}

export const ticketService = {
  async getTickets(options: TicketFilterOptions = {}) {
    const filters: string[] = []

    if (options.company && options.company !== 'all') {
      filters.push(options.company === 'none' ? 'company = ""' : `company = "${options.company}"`)
    }
    if (options.technician && options.technician !== 'all') {
      filters.push(`technician = "${options.technician}"`)
    }
    if (options.requester && options.requester !== 'all') {
      filters.push(`requester = "${options.requester}"`)
    }
    if (options.status && options.status !== 'all') {
      filters.push(`status = "${options.status}"`)
    }
    if (options.priority && options.priority !== 'all') {
      filters.push(`priority = "${options.priority}"`)
    }
    if (options.startDate) {
      filters.push(`opened_at >= "${options.startDate}"`)
    }
    if (options.endDate) {
      filters.push(`opened_at <= "${options.endDate}"`)
    }
    if (options.search && options.search.trim()) {
      const q = options.search.trim()
      filters.push(`(numero ~ "${q}" || title ~ "${q}" || description ~ "${q}")`)
    }

    const filterString = filters.join(' && ')

    return await pb
      .collection('tickets')
      .getList<Ticket>(options.page || 1, options.perPage || 20, {
        filter: filterString || undefined,
        sort: '-created',
        expand: 'company,requester,technician',
      })
  },

  async getAllTickets(filter?: string): Promise<Ticket[]> {
    return await pb.collection('tickets').getFullList<Ticket>({
      filter: filter || undefined,
      sort: '-created',
      expand: 'company,requester,technician',
    })
  },

  async getById(id: string): Promise<Ticket> {
    return await pb.collection('tickets').getOne<Ticket>(id, {
      expand: 'company,requester,technician',
    })
  },

  async findByNumero(numero: string): Promise<Ticket | null> {
    try {
      const cleaned = numero.startsWith('#') ? numero : `#${numero}`
      return await pb.collection('tickets').getFirstListItem<Ticket>(`numero = "${cleaned}"`, {
        expand: 'company,requester,technician',
      })
    } catch {
      return null
    }
  },

  async create(data: {
    company: string | null
    requester: string
    technician?: string
    title: string
    description: string
    priority: TicketPriority
    numero?: string
  }): Promise<Ticket> {
    return await pb.collection('tickets').create<Ticket>({
      ...data,
      numero: data.numero || 'AUTO',
      status: 'Aberto',
      opened_at: new Date().toISOString(),
    })
  },

  async update(id: string, data: Partial<Ticket>): Promise<Ticket> {
    return await pb.collection('tickets').update<Ticket>(id, data)
  },

  async updateStatus(
    id: string,
    status: TicketStatus,
    extra: Partial<Ticket> = {},
  ): Promise<Ticket> {
    const updateData: Partial<Ticket> = { status, ...extra }
    if (status === 'Fechado') {
      updateData.closed_at = new Date().toISOString()
    }
    return await pb.collection('tickets').update<Ticket>(id, updateData)
  },

  async assignTechnician(id: string, technicianId: string): Promise<Ticket> {
    return await pb.collection('tickets').update<Ticket>(id, {
      technician: technicianId,
    })
  },

  async getHistory(ticketId: string): Promise<TicketHistory[]> {
    return await pb.collection('ticket_history').getFullList<TicketHistory>({
      filter: `ticket = "${ticketId}"`,
      sort: 'created',
      expand: 'user',
    })
  },

  async addHistory(data: {
    ticket: string
    type: string
    user?: string
    description?: string
    service_details?: Record<string, unknown>
  }): Promise<TicketHistory> {
    return await pb.collection('ticket_history').create<TicketHistory>(data)
  },

  async getMessages(ticketId: string): Promise<Message[]> {
    return await pb.collection('messages').getFullList<Message>({
      filter: `ticket = "${ticketId}"`,
      sort: 'created',
      expand: 'user',
    })
  },

  async sendMessage(ticketId: string, userId: string, text: string): Promise<Message> {
    return await pb.collection('messages').create<Message>({
      ticket: ticketId,
      user: userId,
      text,
    })
  },
}
