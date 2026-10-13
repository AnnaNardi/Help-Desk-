import pb from '@/lib/api/client'
import { Company } from '@/types/helpdesk'

export const companyService = {
  async getAll(): Promise<Company[]> {
    return await pb.collection('companies').getFullList<Company>({
      sort: 'nome_fantasia',
    })
  },

  async getById(id: string): Promise<Company> {
    return await pb.collection('companies').getOne<Company>(id)
  },

  async create(data: Partial<Company>): Promise<Company> {
    return await pb.collection('companies').create<Company>(data)
  },

  async update(id: string, data: Partial<Company>): Promise<Company> {
    return await pb.collection('companies').update<Company>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('companies').delete(id)
  },
}
