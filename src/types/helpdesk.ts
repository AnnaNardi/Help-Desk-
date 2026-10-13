export type UserRole = 'Admin' | 'Tecnico' | 'Usuario'

export interface Company {
  id: string
  created: string
  updated: string
  razao_social: string
  nome_fantasia: string
  cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  uf?: string
  cep?: string
  responsavel?: string
  contrato_status: 'Ativo' | 'Inativo' | 'Sem contrato'
  ativo: boolean
}

export interface User {
  id: string
  created: string
  updated: string
  email: string
  name: string
  role: UserRole
  company?: string
  expand?: {
    company?: Company
  }
  ativo: boolean
  phone?: string
  avatar?: string
  theme?: 'claro' | 'escuro'
}

export type TicketPriority = 'Alta' | 'Média' | 'Baixa'
export type TicketStatus = 'Aberto' | 'Em andamento' | 'Agendado' | 'Fechado'

export interface Ticket {
  id: string
  created: string
  updated: string
  numero: string
  company: string | null
  requester: string
  technician?: string
  expand?: {
    company?: Company
    requester?: User
    technician?: User
  }
  title: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  opened_at: string
  scheduled_for?: string
  scheduled_note?: string
  closed_at?: string
}

export type TicketHistoryType =
  | 'create'
  | 'assign'
  | 'priority_change'
  | 'status_change'
  | 'schedule'
  | 'service'
  | 'message'
  | 'close'
  | 'reopen'

export interface ServiceDetails {
  atendimento_descricao?: string
  identificado?: string
  realizado?: string
  solucao?: string
  observacoes?: string
}

export interface TicketHistory {
  id: string
  created: string
  updated: string
  ticket: string
  type: TicketHistoryType
  user?: string
  expand?: {
    user?: User
  }
  description?: string
  service_details?: ServiceDetails
}

export interface Message {
  id: string
  created: string
  updated: string
  ticket: string
  user: string
  expand?: {
    user?: User
  }
  text: string
}

export type PreventivaStatus = 'Agendada' | 'Em andamento' | 'Concluída' | 'Cancelada'

export interface Preventiva {
  id: string
  created: string
  updated: string
  company: string
  expand?: {
    company?: Company
    technician?: User
  }
  description: string
  technician: string
  scheduled_date: string
  status: PreventivaStatus
  observations?: string
  completed_date?: string
}

export interface Notification {
  id: string
  created: string
  updated: string
  user: string
  type?: string
  title: string
  message: string
  ticket?: string
  preventiva?: string
  read: boolean
  expand?: {
    ticket?: Ticket
    preventiva?: Preventiva
  }
}

export interface ActivityLog {
  id: string
  created: string
  updated: string
  user?: string
  expand?: {
    user?: User
  }
  action: string
  entity_type?: string
  entity_id?: string
  details?: Record<string, unknown>
}
