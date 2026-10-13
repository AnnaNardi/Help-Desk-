import pb from '@/lib/api/client'
import { Preventiva, PreventivaStatus } from '@/types/helpdesk'

export interface PreventivaFilterOptions {
  company?: string
  technician?: string
  status?: string
  startDate?: string
  endDate?: string
}

export const preventivaService = {
  async getAll(options: PreventivaFilterOptions = {}): Promise<Preventiva[]> {
    const filters: string[] = []

    if (options.company && options.company !== 'all') {
      filters.push(`company = "${options.company}"`)
    }
    if (options.technician && options.technician !== 'all') {
      filters.push(`technician = "${options.technician}"`)
    }
    if (options.status && options.status !== 'all') {
      filters.push(`status = "${options.status}"`)
    }
    if (options.startDate) {
      filters.push(`scheduled_date >= "${options.startDate}"`)
    }
    if (options.endDate) {
      filters.push(`scheduled_date <= "${options.endDate}"`)
    }

    const filterString = filters.join(' && ')

    return await pb.collection('preventivas').getFullList<Preventiva>({
      filter: filterString || undefined,
      sort: 'scheduled_date',
      expand: 'company,technician',
    })
  },

  async getById(id: string): Promise<Preventiva> {
    return await pb.collection('preventivas').getOne<Preventiva>(id, {
      expand: 'company,technician',
    })
  },

  async create(data: {
    company: string
    description: string
    technician: string
    scheduled_date: string
    status: PreventivaStatus
    observations?: string
  }): Promise<Preventiva> {
    return await pb.collection('preventivas').create<Preventiva>(data)
  },

  async update(id: string, data: Partial<Preventiva>): Promise<Preventiva> {
    return await pb.collection('preventivas').update<Preventiva>(id, data)
  },

  async updateStatus(id: string, status: PreventivaStatus): Promise<Preventiva> {
    const updateData: Partial<Preventiva> = { status }
    if (status === 'Concluída') {
      updateData.completed_date = new Date().toISOString()
    }
    return await pb.collection('preventivas').update<Preventiva>(id, updateData)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('preventivas').delete(id)
  },
}
