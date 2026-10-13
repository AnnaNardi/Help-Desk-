import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ticketService } from '@/services/tickets'
import { companyService } from '@/services/companies'
import { notificationService } from '@/services/notifications'
import { preventivaService } from '@/services/preventivas'
import { Ticket, Company, Notification, Preventiva } from '@/types/helpdesk'
import pb from '@/lib/api/client'
import {
  Ticket as TicketIcon,
  Clock,
  Calendar,
  CheckCircle2,
  Building2,
  ArrowUpRight,
  PlusCircle,
  AlertTriangle,
  User,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const Index: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [userNotifs, setUserNotifs] = useState<Notification[]>([])
  const [preventivas, setPreventivas] = useState<Preventiva[]>([])

  // Selected company for detailed view in Admin/TI
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)

  const role = user?.role || 'Usuario'
  const isAdmin = role === 'Admin'
  const isTecnico = role === 'Tecnico'
  const isRegularUser = role === 'Usuario'

  const loadData = async () => {
    try {
      setLoading(true)
      if (isAdmin) {
        const [allT, allC, allP] = await Promise.all([
          ticketService.getAllTickets(),
          companyService.getAll(),
          preventivaService.getAll(),
        ])
        setTickets(allT)
        setCompanies(allC)
        setPreventivas(allP)
      } else if (isTecnico) {
        const [allT, allC, allP, myN] = await Promise.all([
          ticketService.getAllTickets(),
          companyService.getAll(),
          preventivaService.getAll(),
          notificationService.getUserNotifications(user!.id),
        ])
        setTickets(allT)
        setCompanies(allC)
        setPreventivas(allP)
        setUserNotifs(myN.slice(0, 5))
      } else {
        // Regular user: only their tickets and notifications
        const [userT, userN] = await Promise.all([
          ticketService.getTickets({ requester: user!.id, perPage: 50 }),
          notificationService.getUserNotifications(user!.id),
        ])
        setTickets(userT.items)
        setUserNotifs(userN.slice(0, 5))
      }
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    loadData()

    // Subscribe to tickets updates in realtime
    try {
      pb.collection('tickets').subscribe('*', () => {
        loadData()
      })
    } catch {
      /* intentionally ignored */
    }

    return () => {
      try {
        pb.collection('tickets').unsubscribe('*')
      } catch {
        /* intentionally ignored */
      }
    }
  }, [user])

  // Derived counts
  const countAbertos = tickets.filter((t) => t.status === 'Aberto').length
  const countEmAndamento = tickets.filter((t) => t.status === 'Em andamento').length
  const countAgendados = tickets.filter((t) => t.status === 'Agendado').length
  const countFechados = tickets.filter((t) => t.status === 'Fechado').length

  // Selected company tickets
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId)
  const companyTickets = selectedCompanyId
    ? tickets.filter((t) => t.company === selectedCompanyId)
    : []

  // ==========================================
  // 1. DASHBOARD DO USUÁRIO COMUM
  // ==========================================
  if (isRegularUser) {
    const userAbertos = countAbertos
    const userAndamento = countEmAndamento
    const userAgendados = countAgendados
    const userFechados = countFechados

    return (
      <div className="space-y-6">
        {/* Header com boas-vindas e CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1A1E30] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Olá, {user?.name}! 👋
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Painel de autoatendimento e acompanhamento de chamados técnicos.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => navigate('/chamados/novo')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Abrir Novo Chamado
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            onClick={() => navigate('/chamados?status=Aberto')}
            className="cursor-pointer hover:border-blue-500 transition-all border-l-4 border-l-blue-600 bg-white dark:bg-[#1A1E30]"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Meus Abertos
                </p>
                <h3 className="text-2xl font-bold mt-1 tabular-nums">{userAbertos}</h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
                <TicketIcon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => navigate('/chamados?status=Em%20andamento')}
            className="cursor-pointer hover:border-amber-500 transition-all border-l-4 border-l-amber-500 bg-white dark:bg-[#1A1E30]"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Em Andamento
                </p>
                <h3 className="text-2xl font-bold mt-1 tabular-nums">{userAndamento}</h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => navigate('/chamados?status=Agendado')}
            className="cursor-pointer hover:border-sky-500 transition-all border-l-4 border-l-sky-500 bg-white dark:bg-[#1A1E30]"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Agendados
                </p>
                <h3 className="text-2xl font-bold mt-1 tabular-nums">{userAgendados}</h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600">
                <Calendar className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => navigate('/chamados?status=Fechado')}
            className="cursor-pointer hover:border-green-500 transition-all border-l-4 border-l-green-600 bg-white dark:bg-[#1A1E30]"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Fechados
                </p>
                <h3 className="text-2xl font-bold mt-1 tabular-nums">{userFechados}</h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-950/50 flex items-center justify-center text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid de Chamados Recentes e Notificações */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Meus Chamados Recentes
              </h2>
              <Button asChild variant="ghost" size="sm" className="text-xs text-blue-600">
                <Link to="/chamados">Ver todos</Link>
              </Button>
            </div>

            <div className="bg-white dark:bg-[#1A1E30] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {tickets.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Você ainda não possui nenhum chamado aberto.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tickets.slice(0, 6).map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => navigate(`/chamados/${ticket.id}`)}
                      className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                            {ticket.numero}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                            {ticket.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{ticket.description}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            ticket.status === 'Fechado'
                              ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300'
                              : ticket.status === 'Em andamento' || ticket.status === 'Agendado'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {ticket.status}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notificações Recentes */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Notificações Recentes
            </h2>
            <div className="bg-white dark:bg-[#1A1E30] rounded-xl border border-slate-200 dark:border-slate-800 p-4 divide-y divide-slate-100 dark:divide-slate-800">
              {userNotifs.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Nenhuma notificação recente.
                </p>
              ) : (
                userNotifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.ticket) navigate(`/chamados/${n.ticket}`)
                      else navigate('/notificacoes')
                    }}
                    className="py-3 first:pt-0 last:pb-0 cursor-pointer hover:opacity-80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {n.title}
                      </span>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(n.created).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // 2. DASHBOARD INDIVIDUAL POR EMPRESA
  // (Quando Admin ou Técnico seleciona uma empresa específica)
  // ==========================================
  if (selectedCompany) {
    const cAbertos = companyTickets.filter((t) => t.status === 'Aberto').length
    const cAndamento = companyTickets.filter((t) => t.status === 'Em andamento').length
    const cAgendados = companyTickets.filter((t) => t.status === 'Agendado').length
    const cFechados = companyTickets.filter((t) => t.status === 'Fechado').length
    const cPreventivas = preventivas.filter((p) => p.company === selectedCompany.id)

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1A1E30] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCompanyId(null)}
                className="text-xs"
              >
                ← Voltar ao Geral
              </Button>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {selectedCompany.nome_fantasia}
              </h1>
              {selectedCompany.contrato_status === 'Sem contrato' ? (
                <span className="text-xs font-semibold text-sky-500 border border-dashed border-sky-400 px-2 py-0.5 rounded">
                  Cliente sem contrato
                </span>
              ) : (
                <Badge
                  variant={selectedCompany.contrato_status === 'Ativo' ? 'default' : 'destructive'}
                >
                  {selectedCompany.contrato_status}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Razão Social: {selectedCompany.razao_social} | Responsável:{' '}
              {selectedCompany.responsavel || 'N/A'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/empresas/${selectedCompany.id}`)}
            >
              Editar Empresa
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/chamados/novo?company=${selectedCompany.id}`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Novo Chamado
            </Button>
          </div>
        </div>

        {/* KPIs da empresa */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            onClick={() => navigate(`/chamados?company=${selectedCompany.id}&status=Aberto`)}
            className="cursor-pointer hover:border-blue-500 border-l-4 border-l-blue-600"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Abertos</p>
                <h3 className="text-2xl font-bold mt-1 tabular-nums">{cAbertos}</h3>
              </div>
              <TicketIcon className="h-6 w-6 text-blue-600" />
            </CardContent>
          </Card>
          <Card
            onClick={() =>
              navigate(`/chamados?company=${selectedCompany.id}&status=Em%20andamento`)
            }
            className="cursor-pointer hover:border-amber-500 border-l-4 border-l-amber-500"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Em Andamento</p>
                <h3 className="text-2xl font-bold mt-1 tabular-nums">{cAndamento}</h3>
              </div>
              <Clock className="h-6 w-6 text-amber-500" />
            </CardContent>
          </Card>
          <Card
            onClick={() => navigate(`/chamados?company=${selectedCompany.id}&status=Agendado`)}
            className="cursor-pointer hover:border-sky-500 border-l-4 border-l-sky-500"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Agendados</p>
                <h3 className="text-2xl font-bold mt-1 tabular-nums">{cAgendados}</h3>
              </div>
              <Calendar className="h-6 w-6 text-sky-500" />
            </CardContent>
          </Card>
          <Card
            onClick={() => navigate(`/chamados?company=${selectedCompany.id}&status=Fechado`)}
            className="cursor-pointer hover:border-green-500 border-l-4 border-l-green-600"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Fechados</p>
                <h3 className="text-2xl font-bold mt-1 tabular-nums">{cFechados}</h3>
              </div>
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </CardContent>
          </Card>
        </div>

        {/* Tabela de chamados da empresa */}
        <div className="bg-white dark:bg-[#1A1E30] rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm">Chamados Recentes desta Empresa</h3>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link to={`/chamados?company=${selectedCompany.id}`}>
                Ver todos ({companyTickets.length})
              </Link>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                  <th className="pb-2">Nº</th>
                  <th className="pb-2">Título</th>
                  <th className="pb-2">Prioridade</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Técnico</th>
                  <th className="pb-2">Abertura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {companyTickets.slice(0, 8).map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/chamados/${t.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  >
                    <td className="py-2.5 font-bold font-mono text-blue-600">{t.numero}</td>
                    <td className="py-2.5 font-medium max-w-xs truncate">{t.title}</td>
                    <td className="py-2.5">
                      <span className="flex items-center gap-1.5">
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
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500">
                      {t.expand?.technician?.name || 'Não atribuído'}
                    </td>
                    <td className="py-2.5 text-slate-500">
                      {new Date(t.opened_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Preventivas da empresa */}
        <div className="bg-white dark:bg-[#1A1E30] rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">Preventivas Programadas</h3>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link to={`/preventivas?company=${selectedCompany.id}`}>Gerenciar</Link>
            </Button>
          </div>
          {cPreventivas.length === 0 ? (
            <p className="text-xs text-slate-500">
              Nenhuma preventiva cadastrada para esta empresa.
            </p>
          ) : (
            <div className="space-y-2">
              {cPreventivas.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-50 dark:bg-[#131728] rounded-lg flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {p.description}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Técnico: {p.expand?.technician?.name} | Programada para:{' '}
                      {new Date(p.scheduled_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ==========================================
  // 3. DASHBOARD GLOBAL DE T.I. (Admin e Técnicos)
  // ==========================================
  const totalTickets = tickets.length
  const percentAberto = totalTickets > 0 ? Math.round((countAbertos / totalTickets) * 100) : 0
  const percentAndamento =
    totalTickets > 0 ? Math.round((countEmAndamento / totalTickets) * 100) : 0
  const percentAgendado = totalTickets > 0 ? Math.round((countAgendados / totalTickets) * 100) : 0
  const percentFechado = totalTickets > 0 ? Math.round((countFechados / totalTickets) * 100) : 0

  // Group tickets per company
  const companySummary = companies.map((comp) => {
    const cTickets = tickets.filter((t) => t.company === comp.id)
    return {
      company: comp,
      abertos: cTickets.filter((t) => t.status === 'Aberto').length,
      andamento: cTickets.filter((t) => t.status === 'Em andamento').length,
      agendados: cTickets.filter((t) => t.status === 'Agendado').length,
      fechados: cTickets.filter((t) => t.status === 'Fechado').length,
      total: cTickets.length,
    }
  })

  return (
    <div className="space-y-6">
      {/* Header com boas-vindas e ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Painel Geral de Atendimentos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitoramento centralizado de incidentes, solicitações e preventivas multiempresa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/chamados/novo')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Novo Chamado
          </Button>
        </div>
      </div>

      {/* KPI Cards Row (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chamados Abertos */}
        <div
          onClick={() => navigate('/chamados?status=Aberto')}
          className="cursor-pointer group relative overflow-hidden rounded-xl bg-white dark:bg-[#1A1E30] p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Chamados Abertos
              </span>
              <h2 className="text-3xl font-extrabold tabular-nums text-blue-600 dark:text-blue-400">
                {countAbertos}
              </h2>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TicketIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Aguardando início</span>
            <span className="font-semibold text-blue-600">{percentAberto}% do total</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
        </div>

        {/* Em Andamento */}
        <div
          onClick={() => navigate('/chamados?status=Em%20andamento')}
          className="cursor-pointer group relative overflow-hidden rounded-xl bg-white dark:bg-[#1A1E30] p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Em Andamento
              </span>
              <h2 className="text-3xl font-extrabold tabular-nums text-amber-500">
                {countEmAndamento}
              </h2>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Técnico alocado</span>
            <span className="font-semibold text-amber-600">{percentAndamento}% do total</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Agendados */}
        <div
          onClick={() => navigate('/chamados?status=Agendado')}
          className="cursor-pointer group relative overflow-hidden rounded-xl bg-white dark:bg-[#1A1E30] p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Agendados
              </span>
              <h2 className="text-3xl font-extrabold tabular-nums text-sky-500">
                {countAgendados}
              </h2>
            </div>
            <div className="h-12 w-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Visita programada</span>
            <span className="font-semibold text-sky-600">{percentAgendado}% do total</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500" />
        </div>

        {/* Fechados */}
        <div
          onClick={() => navigate('/chamados?status=Fechado')}
          className="cursor-pointer group relative overflow-hidden rounded-xl bg-white dark:bg-[#1A1E30] p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Fechados / Resolvidos
              </span>
              <h2 className="text-3xl font-extrabold tabular-nums text-green-600 dark:text-green-400">
                {countFechados}
              </h2>
            </div>
            <div className="h-12 w-12 rounded-xl bg-green-50 dark:bg-green-950/60 text-green-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Solução aplicada</span>
            <span className="font-semibold text-green-600">{percentFechado}% do total</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600" />
        </div>
      </div>

      {/* Gráficos Resumo: Donut de Status + Barras por Empresa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut de Status */}
        <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
              {/* SVG Donut */}
              <div className="relative h-44 w-44 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  {/* Slice Aberto (Blue) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="transparent"
                    stroke="#2563EB"
                    strokeWidth="3.5"
                    strokeDasharray={`${percentAberto * 0.88} 100`}
                    strokeDashoffset="0"
                  />
                  {/* Slice Andamento (Amber) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="transparent"
                    stroke="#D97706"
                    strokeWidth="3.5"
                    strokeDasharray={`${percentAndamento * 0.88} 100`}
                    strokeDashoffset={`-${percentAberto * 0.88}`}
                  />
                  {/* Slice Agendado (Sky) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="transparent"
                    stroke="#0EA5E9"
                    strokeWidth="3.5"
                    strokeDasharray={`${percentAgendado * 0.88} 100`}
                    strokeDashoffset={`-${(percentAberto + percentAndamento) * 0.88}`}
                  />
                  {/* Slice Fechado (Green) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="transparent"
                    stroke="#16A34A"
                    strokeWidth="3.5"
                    strokeDasharray={`${percentFechado * 0.88} 100`}
                    strokeDashoffset={`-${(percentAberto + percentAndamento + percentAgendado) * 0.88}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold">{totalTickets}</span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Total</span>
                </div>
              </div>

              {/* Legenda com contadores */}
              <div className="space-y-2 text-xs w-full max-w-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-600" />
                    Aberto
                  </span>
                  <span className="font-bold">
                    {countAbertos} ({percentAberto}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    Em andamento
                  </span>
                  <span className="font-bold">
                    {countEmAndamento} ({percentAndamento}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-sky-500" />
                    Agendado
                  </span>
                  <span className="font-bold">
                    {countAgendados} ({percentAgendado}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-600" />
                    Fechado
                  </span>
                  <span className="font-bold">
                    {countFechados} ({percentFechado}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Barras de Chamados por Empresa */}
        <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-500" />
              Volume por Empresa Contratante
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-3 pt-1">
              {companySummary.slice(0, 5).map((item, idx) => {
                const maxTickets = Math.max(...companySummary.map((s) => s.total), 1)
                const barWidth = Math.round((item.total / maxTickets) * 100)
                const colors = [
                  'bg-blue-600',
                  'bg-sky-500',
                  'bg-indigo-500',
                  'bg-amber-500',
                  'bg-emerald-500',
                ]
                const color = colors[idx % colors.length]

                return (
                  <div key={item.company.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {item.company.nome_fantasia}
                      </span>
                      <span className="font-mono text-slate-500">{item.total} chamados</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(barWidth, 6)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Resumo por Empresa (Com link para Dashboard da Empresa) */}
      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            Resumo Operacional por Empresa
          </CardTitle>
          <span className="text-xs text-slate-400">
            Clique na empresa para abrir seu painel dedicado
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#131728] border-y border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Empresa / Cliente</th>
                  <th className="py-3 px-3">Contrato</th>
                  <th className="py-3 px-3 text-center">Abertos</th>
                  <th className="py-3 px-3 text-center">Em Andamento</th>
                  <th className="py-3 px-3 text-center">Agendados</th>
                  <th className="py-3 px-3 text-center">Fechados</th>
                  <th className="py-3 px-3 text-center">Total</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {companySummary.map((item) => {
                  const isSemContr = item.company.contrato_status === 'Sem contrato'
                  return (
                    <tr
                      key={item.company.id}
                      onClick={() => setSelectedCompanyId(item.company.id)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.company.nome_fantasia}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {item.company.razao_social}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {isSemContr ? (
                          <span className="inline-block text-[10px] font-medium text-sky-500 border border-dashed border-sky-400 rounded px-1.5 py-0.5">
                            Cliente sem contrato
                          </span>
                        ) : (
                          <Badge
                            variant={
                              item.company.contrato_status === 'Ativo' ? 'default' : 'secondary'
                            }
                            className="text-[10px]"
                          >
                            {item.company.contrato_status}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-blue-600">
                        {item.abertos}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-amber-500">
                        {item.andamento}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-sky-500">
                        {item.agendados}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-green-600">
                        {item.fechados}
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono">{item.total}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-blue-600 hover:text-blue-700"
                        >
                          Painel <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 8 Chamados Recentes em Tabela Completa */}
      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TicketIcon className="h-4 w-4 text-blue-600" />
            Últimos 8 Chamados Registrados
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-xs text-blue-600">
            <Link to="/chamados">Ver todos os chamados</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#131728] border-y border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-3">Título</th>
                  <th className="py-3 px-3">Empresa</th>
                  <th className="py-3 px-3">Prioridade</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Técnico</th>
                  <th className="py-3 px-4 text-right">Abertura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tickets.slice(0, 8).map((ticket) => {
                  const isSemContr = ticket.expand?.company?.contrato_status === 'Sem contrato'
                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => navigate(`/chamados/${ticket.id}`)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {ticket.numero}
                      </td>
                      <td className="py-3 px-3 font-medium max-w-xs truncate text-slate-900 dark:text-slate-100">
                        {ticket.title}
                      </td>
                      <td className="py-3 px-3">
                        {isSemContr ? (
                          <span className="text-[10px] font-medium text-sky-500 border border-dashed border-sky-400 rounded px-1.5 py-0.5">
                            Cliente sem contrato
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {ticket.expand?.company?.nome_fantasia || 'Pessoa física / sem empresa'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              ticket.priority === 'Alta'
                                ? 'bg-red-500'
                                : ticket.priority === 'Média'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                            }`}
                          />
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            ticket.status === 'Fechado'
                              ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300'
                              : ticket.status === 'Em andamento'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : ticket.status === 'Agendado'
                                  ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {ticket.expand?.technician?.name || 'Não atribuído'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        {new Date(ticket.opened_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export default Index
