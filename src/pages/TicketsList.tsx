import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ticketService } from '@/services/tickets'
import { companyService } from '@/services/companies'
import { userService } from '@/services/users'
import { Ticket, Company, User } from '@/types/helpdesk'
import pb from '@/lib/api/client'
import { Ticket as TicketIcon, Search, PlusCircle, LayoutGrid, List, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ResponsivePagination, useResponsivePageSize } from '@/components/ResponsivePagination'

export const TicketsList: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const pageSize = useResponsivePageSize()

  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  // Filter options
  const [companies, setCompanies] = useState<Company[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])

  // Active filters from query params or state
  const statusFilter = searchParams.get('status') || 'all'
  const companyFilter = searchParams.get('company') || 'all'
  const techFilter = searchParams.get('technician') || 'all'
  const priorityFilter = searchParams.get('priority') || 'all'
  const periodFilter = searchParams.get('period') || 'all'
  const searchQuery = searchParams.get('search') || ''

  const role = user?.role || 'Usuario'
  const isAdmin = role === 'Admin'
  const isTecnico = role === 'Tecnico'

  useEffect(() => {
    // Load metadata (companies, technicians) for filters
    const loadMeta = async () => {
      try {
        if (isAdmin || isTecnico) {
          const [comps, techs] = await Promise.all([
            companyService.getAll(),
            userService.getTechnicians(),
          ])
          setCompanies(comps)
          setTechnicians(techs)
        }
      } catch {
        /* intentionally ignored */
      }
    }
    loadMeta()
  }, [isAdmin, isTecnico])

  // Load tickets based on current filters
  const fetchTickets = async () => {
    try {
      setLoading(true)

      let startDate: string | undefined = undefined
      let endDate: string | undefined = undefined
      const now = new Date()

      if (periodFilter === 'today') {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        startDate = d.toISOString()
      } else if (periodFilter === 'week') {
        const d = new Date()
        d.setDate(d.getDate() - 7)
        startDate = d.toISOString()
      } else if (periodFilter === 'month') {
        const d = new Date()
        d.setMonth(d.getMonth() - 1)
        startDate = d.toISOString()
      }

      const res = await ticketService.getTickets({
        company: companyFilter,
        technician: techFilter,
        status: statusFilter,
        priority: priorityFilter,
        search: searchQuery,
        startDate,
        endDate,
        page,
        perPage: pageSize,
      })

      setTickets(res.items)
      setTotalItems(res.totalItems)
    } catch (err) {
      console.error('Erro ao buscar chamados:', err)
    } finally {
      setLoading(false)
    }
  }

  // Quando o pageSize mudar por redimensionamento mobile/pc, ajusta página se necessário
  useEffect(() => {
    fetchTickets()
  }, [
    statusFilter,
    companyFilter,
    techFilter,
    priorityFilter,
    periodFilter,
    searchQuery,
    page,
    pageSize,
  ])

  // Realtime subscription
  useEffect(() => {
    const unsub = pb.collection('tickets').subscribe('*', () => {
      fetchTickets()
    })
    return () => {
      pb.collection('tickets').unsubscribe('*')
    }
  }, [])

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value === 'all' || !value) {
      newParams.delete(key)
    } else {
      newParams.set(key, value)
    }
    setPage(1)
    setSearchParams(newParams)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {role === 'Usuario' ? 'Meus Chamados' : 'Gestão de Chamados'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {totalItems} chamado(s) encontrado(s) com os critérios atuais
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="hidden sm:flex border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-white dark:bg-[#1A1E30]">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={() => navigate('/chamados/novo')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Abrir Chamado
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nº, título, texto..."
                value={searchQuery}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={(val) => updateFilter('status', val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Status: Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Status: Todos</SelectItem>
                  <SelectItem value="Aberto">Aberto</SelectItem>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Agendado">Agendado</SelectItem>
                  <SelectItem value="Fechado">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div>
              <Select value={priorityFilter} onValueChange={(val) => updateFilter('priority', val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Prioridade: Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Prioridade: Todas</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Company Filter (Admin/Tech) */}
            {(isAdmin || isTecnico) && (
              <div>
                <Select value={companyFilter} onValueChange={(val) => updateFilter('company', val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Empresa: Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Empresa: Todas</SelectItem>
                    <SelectItem value="none">Pessoa Física / Sem empresa</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome_fantasia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Period Filter */}
            <div>
              <Select value={periodFilter} onValueChange={(val) => updateFilter('period', val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Período: Todo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Período: Todo</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
          Carregando chamados...
        </div>
      ) : tickets.length === 0 ? (
        <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800 text-center py-16">
          <CardContent className="space-y-3">
            <TicketIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">
              Nenhum chamado encontrado
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Não há registros para os filtros selecionados. Tente alterar os parâmetros de busca ou
              abra um novo chamado.
            </p>
            <Button
              onClick={() => navigate('/chamados/novo')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs mt-2"
            >
              Abrir Chamado Agora
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* Table View */
        <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#131728] border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  <tr>
                    <th className="py-3 px-4">Número</th>
                    <th className="py-3 px-3">Título</th>
                    <th className="py-3 px-3">Empresa</th>
                    <th className="py-3 px-3">Solicitante</th>
                    <th className="py-3 px-3">Prioridade</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Técnico</th>
                    <th className="py-3 px-4 text-right">Abertura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tickets.map((t) => {
                    const isSemContr = t.expand?.company?.contrato_status === 'Sem contrato'
                    return (
                      <tr
                        key={t.id}
                        onClick={() => navigate(`/chamados/${t.id}`)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {t.numero}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 max-w-xs">
                            {t.title}
                          </span>
                          <span className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">
                            {t.description}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          {isSemContr ? (
                            <span className="text-[10px] font-medium text-sky-500 border border-dashed border-sky-400 rounded px-1.5 py-0.5">
                              Cliente sem contrato
                            </span>
                          ) : (
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {t.expand?.company?.nome_fantasia || 'Pessoa física / sem empresa'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                          {t.expand?.requester?.name || 'Solicitante'}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="flex items-center gap-1.5 font-medium">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                t.priority === 'Alta'
                                  ? 'bg-red-500'
                                  : t.priority === 'Média'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                              }`}
                            />
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                              t.status === 'Fechado'
                                ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300'
                                : t.status === 'Em andamento'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                  : t.status === 'Agendado'
                                    ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-500">
                          {t.expand?.technician?.name || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400 whitespace-nowrap">
                          {new Date(t.opened_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Cards View (Mobile/Tablet Friendly) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((t) => (
            <Card
              key={t.id}
              onClick={() => navigate(`/chamados/${t.id}`)}
              className="cursor-pointer hover:border-blue-500 transition-all bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    {t.numero}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      t.status === 'Fechado'
                        ? 'bg-green-100 dark:bg-green-950 text-green-700'
                        : t.status === 'Em andamento'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-700'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{t.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{t.expand?.company?.nome_fantasia || 'Pessoa física / sem empresa'}</span>
                  <span>{new Date(t.opened_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      <ResponsivePagination
        currentPage={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        itemName="chamados"
      />
    </div>
  )
}
export default TicketsList
