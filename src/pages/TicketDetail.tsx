import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ticketService } from '@/services/tickets'
import { userService } from '@/services/users'
import {
  Ticket,
  TicketHistory,
  Message,
  User,
  TicketStatus,
  TicketPriority,
} from '@/types/helpdesk'
import pb from '@/lib/api/client'
import {
  ArrowLeft,
  Clock,
  UserCheck,
  Calendar,
  Send,
  AlertCircle,
  CheckCircle2,
  Play,
  RotateCcw,
  CheckSquare,
  Wrench,
  MessageSquare,
  FileText,
  Shield,
  Loader2,
  Key,
  Edit2,
  ChevronsUpDown,
  Check,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { companyService } from '@/services/companies'
import { cn } from '@/lib/utils'

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [history, setHistory] = useState<TicketHistory[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Technicians list for assignment modal
  const [technicians, setTechnicians] = useState<User[]>([])

  // Modals state
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedTech, setSelectedTech] = useState<string>('')

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleNote, setScheduleNote] = useState('')

  const [closeModalOpen, setCloseModalOpen] = useState(false)
  const [closeSolution, setCloseSolution] = useState('')

  const [reopenModalOpen, setReopenModalOpen] = useState(false)
  const [reopenReason, setReopenReason] = useState('')

  // Reset requester password state (Admin / TI)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [resettingPass, setResettingPass] = useState(false)
  const [generatedPassResult, setGeneratedPassResult] = useState<string | null>(null)

  // Edit ticket modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState<TicketPriority>('Média')
  const [editCompany, setEditCompany] = useState('')
  const [editRequester, setEditRequester] = useState('')
  const [editTechnician, setEditTechnician] = useState('none')
  const [editCompanies, setEditCompanies] = useState<any[]>([])
  const [editRequestersList, setEditRequestersList] = useState<User[]>([])
  const [loadingEditRequesters, setLoadingEditRequesters] = useState(false)
  const [editRequesterComboboxOpen, setEditRequesterComboboxOpen] = useState(false)

  // Technical service form
  const [serviceDesc, setServiceDesc] = useState('')
  const [serviceIdentificado, setServiceIdentificado] = useState('')
  const [serviceRealizado, setServiceRealizado] = useState('')
  const [serviceSolucao, setServiceSolucao] = useState('')
  const [serviceObs, setServiceObs] = useState('')
  const [submittingService, setSubmittingService] = useState(false)

  // Chat message state
  const [newMsgText, setNewMsgText] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  const role = user?.role || 'Usuario'
  const isAdmin = role === 'Admin'
  const isTecnico = role === 'Tecnico'

  const loadTicketData = async () => {
    if (!id) return
    try {
      const [t, h, m] = await Promise.all([
        ticketService.getById(id),
        ticketService.getHistory(id),
        ticketService.getMessages(id),
      ])
      setTicket(t)
      setHistory(h)
      setMessages(m)
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err)
      setError('Chamado não encontrado ou sem permissão de acesso.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTicketData()

    if (isAdmin || isTecnico) {
      userService
        .getTechnicians()
        .then(setTechnicians)
        .catch(() => {})
    }

    // Subscribe to realtime updates for this ticket, history, messages
    const unsubTicket = pb.collection('tickets').subscribe(id!, () => {
      loadTicketData()
    })
    const unsubHistory = pb.collection('ticket_history').subscribe('*', (e) => {
      if (e.record.ticket === id) loadTicketData()
    })
    const unsubMessages = pb.collection('messages').subscribe('*', (e) => {
      if (e.record.ticket === id) loadTicketData()
    })

    return () => {
      try {
        pb.collection('tickets').unsubscribe(id!)
        pb.collection('ticket_history').unsubscribe('*')
        pb.collection('messages').unsubscribe('*')
      } catch {
        /* intentionally ignored */
      }
    }
  }, [id, isAdmin, isTecnico])

  // Action Handlers
  const handleStatusChange = async (newStatus: TicketStatus, extra: Partial<Ticket> = {}) => {
    if (!ticket) return
    try {
      await ticketService.updateStatus(ticket.id, newStatus, extra)
      await loadTicketData()
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      alert('Erro ao atualizar status: ' + (errorObj.message || 'Falha na requisição'))
    }
  }

  const handleAssignTechnician = async () => {
    if (!ticket || !selectedTech) return
    try {
      await ticketService.assignTechnician(ticket.id, selectedTech)
      setAssignModalOpen(false)
      await loadTicketData()
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      alert('Erro ao atribuir técnico: ' + errorObj.message)
    }
  }

  const handleScheduleConfirm = async () => {
    if (!ticket || !scheduleDate) return
    await handleStatusChange('Agendado', {
      scheduled_for: new Date(scheduleDate).toISOString(),
      scheduled_note: scheduleNote,
    })
    setScheduleModalOpen(false)
  }

  const handleCloseConfirm = async () => {
    if (!ticket || !closeSolution.trim()) return
    try {
      await ticketService.addHistory({
        ticket: ticket.id,
        type: 'close',
        user: user?.id,
        description: 'Chamado finalizado com solução: ' + closeSolution.trim(),
        service_details: {
          solucao: closeSolution.trim(),
        },
      })
      await ticketService.updateStatus(ticket.id, 'Fechado', {
        closed_at: new Date().toISOString(),
      })
      setCloseModalOpen(false)
      await loadTicketData()
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      alert('Erro ao fechar chamado: ' + errorObj.message)
    }
  }

  const handleReopenConfirm = async () => {
    if (!ticket || !reopenReason.trim()) return
    try {
      await ticketService.addHistory({
        ticket: ticket.id,
        type: 'reopen',
        user: user?.id,
        description: 'Chamado reaberto. Motivo: ' + reopenReason.trim(),
      })
      await ticketService.updateStatus(ticket.id, 'Aberto', {
        closed_at: '',
      })
      setReopenModalOpen(false)
      await loadTicketData()
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      alert('Erro ao reabrir chamado: ' + errorObj.message)
    }
  }

  const handleRegisterService = async (closeAfter = false) => {
    if (!ticket) return
    setSubmittingService(true)
    try {
      await ticketService.addHistory({
        ticket: ticket.id,
        type: 'service',
        user: user?.id,
        description: serviceDesc || 'Atendimento técnico registrado no chamado.',
        service_details: {
          atendimento_descricao: serviceDesc,
          identificado: serviceIdentificado,
          realizado: serviceRealizado,
          solucao: serviceSolucao,
          observacoes: serviceObs,
        },
      })

      if (closeAfter) {
        await ticketService.updateStatus(ticket.id, 'Fechado', {
          closed_at: new Date().toISOString(),
        })
      } else if (ticket.status === 'Aberto') {
        await ticketService.updateStatus(ticket.id, 'Em andamento')
      }

      setServiceDesc('')
      setServiceIdentificado('')
      setServiceRealizado('')
      setServiceSolucao('')
      setServiceObs('')
      await loadTicketData()
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      alert('Erro ao registrar atendimento: ' + errorObj.message)
    } finally {
      setSubmittingService(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticket || !newMsgText.trim() || !user) return
    setSendingMsg(true)
    try {
      await ticketService.sendMessage(ticket.id, user.id, newMsgText.trim())
      await ticketService.addHistory({
        ticket: ticket.id,
        type: 'message',
        user: user.id,
        description: 'Nova mensagem postada na discussão.',
      })
      setNewMsgText('')
      await loadTicketData()
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      alert('Erro ao enviar mensagem: ' + errorObj.message)
    } finally {
      setSendingMsg(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
        Carregando detalhes do chamado...
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold">Acesso Indisponível</h2>
        <p className="text-xs text-slate-500">{error}</p>
        <Button onClick={() => navigate('/chamados')}>Voltar para Lista</Button>
      </div>
    )
  }

  // Carrega empresas quando abre o modal de edição
  const handleOpenEdit = async () => {
    if (!ticket) return
    setEditTitle(ticket.title)
    setEditDescription(ticket.description)
    setEditPriority(ticket.priority)
    const companyValue = ticket.company || 'none'
    setEditCompany(companyValue)
    setEditRequester(ticket.requester)
    setEditTechnician(ticket.technician || 'none')
    setEditModalOpen(true)

    try {
      if (isAdmin || isTecnico) {
        const [comps, requesters] = await Promise.all([
          companyService.getAll(),
          companyValue === 'none'
            ? userService.getWithoutCompany()
            : userService.getByCompany(companyValue),
        ])
        setEditCompanies(comps)
        setEditRequestersList(requesters)
      }
    } catch (err) {
      console.error('Erro ao buscar empresas para edição:', err)
    }
  }

  const handleEditCompanyChange = async (newCompanyId: string) => {
    setEditCompany(newCompanyId)
    setEditRequester('')
    setLoadingEditRequesters(true)
    try {
      const requesters = newCompanyId === 'none'
        ? await userService.getWithoutCompany()
        : await userService.getByCompany(newCompanyId)
      setEditRequestersList(requesters)
    } catch (err) {
      console.error('Erro ao carregar solicitantes:', err)
      setEditRequestersList([])
    } finally {
      setLoadingEditRequesters(false)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticket) return

    const finalCompany = isAdmin || isTecnico
      ? editCompany === 'none' ? null : editCompany
      : user?.company || null
    const finalRequester = isAdmin || isTecnico ? editRequester : user?.id

    if ((isAdmin || isTecnico) && !editCompany) {
      alert('Selecione uma empresa ou Pessoa Física / Sem empresa.')
      return
    }
    if (!finalRequester) {
      alert('Selecione o solicitante do chamado.')
      return
    }
    if (!editTitle.trim() || !editDescription.trim()) {
      alert('Título e descrição são obrigatórios.')
      return
    }

    setSavingEdit(true)
    try {
      await ticketService.update(ticket.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        company: finalCompany,
        requester: finalRequester,
        technician: editTechnician !== 'none' ? editTechnician : undefined,
      })

      await ticketService.addHistory({
        ticket: ticket.id,
        type: 'priority_change',
        user: user?.id,
        description: 'Informações do chamado atualizadas na edição.',
      })

      setEditModalOpen(false)
      await loadTicketData()
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      alert('Erro ao atualizar chamado: ' + errorObj.message)
    } finally {
      setSavingEdit(false)
    }
  }

  const isSemContrato = ticket.expand?.company?.contrato_status === 'Sem contrato'
  const isPasswordResetTicket =
    ticket.title.toLowerCase().includes('redefinição de senha') ||
    ticket.description.toLowerCase().includes('redefinição de senha')

  const handleGenerateRandomPass = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
    let res = ''
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(res)
  }

  const handleResetRequesterPassword = async () => {
    if (!ticket?.requester || !newPassword) return
    if (newPassword.length < 8) {
      alert('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }
    setResettingPass(true)
    try {
      await userService.adminResetPassword(ticket.requester, newPassword, ticket.id)
      setGeneratedPassResult(newPassword)
      setResetModalOpen(false)
      setNewPassword('')
      await loadTicketData()
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      alert('Erro ao redefinir senha: ' + (errorObj.message || 'Falha na requisição'))
    } finally {
      setResettingPass(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/chamados')}
            className="text-xs text-slate-500"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Chamados
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-extrabold text-blue-600 dark:text-blue-400">
                {ticket.numero}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  ticket.status === 'Fechado'
                    ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                    : ticket.status === 'Em andamento'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      : ticket.status === 'Agendado'
                        ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                }`}
              >
                {ticket.status}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
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
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              {ticket.title}
            </h1>
          </div>
        </div>

        {/* Action Buttons based on Role & Status */}
        <div className="flex flex-wrap items-center gap-2">
          {ticket.status !== 'Fechado' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenEdit}
              className="text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
            >
              <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Editar Chamado
            </Button>
          )}

          {isAdmin && ticket.status !== 'Fechado' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setNewPassword('')
                setResetModalOpen(true)
              }}
              className="text-xs text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-medium"
            >
              <Key className="h-3.5 w-3.5 mr-1.5" /> Redefinir Senha do Solicitante
            </Button>
          )}
          {ticket.status === 'Aberto' && (isAdmin || isTecnico) && (
            <Button
              size="sm"
              onClick={() => handleStatusChange('Em andamento')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              <Play className="h-3.5 w-3.5 mr-1.5" /> Iniciar Atendimento
            </Button>
          )}

          {(ticket.status === 'Aberto' || ticket.status === 'Em andamento') &&
            (isAdmin || isTecnico) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setScheduleModalOpen(true)}
                className="text-xs"
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5" /> Agendar Visita
              </Button>
            )}

          {ticket.status !== 'Fechado' && (isAdmin || isTecnico) && (
            <Button
              size="sm"
              onClick={() => setCloseModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Fechar Chamado
            </Button>
          )}

          {ticket.status === 'Fechado' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReopenModalOpen(true)}
              className="text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reabrir Chamado
            </Button>
          )}
        </div>
      </div>

      {/* Banner de Destaque para Chamado de Redefinição de Senha */}
      {isPasswordResetTicket && ticket.status !== 'Fechado' && (
        <Card className="border-amber-300 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                  Chamado de Redefinição de Senha
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Solicitante: <strong>{ticket.expand?.requester?.name}</strong> (
                  {ticket.expand?.requester?.email}).
                  {isAdmin
                    ? ' Você pode redefinir a senha do usuário com a ação rápida abaixo.'
                    : ' Apenas administradores do T.I. podem redefinir a credencial.'}
                </p>
              </div>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => {
                  setNewPassword('')
                  setResetModalOpen(true)
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0"
              >
                <Key className="h-3.5 w-3.5 mr-1.5" />
                Redefinir Senha Agora
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Grid: Details Left, Meta Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Description, Atendimento, Histórico, Mensagens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Descrição da Solicitação
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {ticket.description}
            </CardContent>
          </Card>

          {/* Atendimento Técnico Form (Admin e Técnicos) */}
          {(isAdmin || isTecnico) && ticket.status !== 'Fechado' && (
            <Card className="bg-white dark:bg-[#1A1E30] border-blue-200 dark:border-blue-900 shadow-sm">
              <CardHeader className="pb-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-t-xl">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-900 dark:text-blue-300">
                  <Wrench className="h-4 w-4 text-blue-600" />
                  Registro de Atendimento Técnico
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase text-slate-500">
                      O que foi identificado / Causa raiz
                    </label>
                    <Input
                      placeholder="Ex: Curto-circuito na fonte de alimentação"
                      value={serviceIdentificado}
                      onChange={(e) => setServiceIdentificado(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase text-slate-500">
                      O que foi realizado
                    </label>
                    <Input
                      placeholder="Ex: Troca da fonte por modelo 500W bivolt"
                      value={serviceRealizado}
                      onChange={(e) => setServiceRealizado(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase text-slate-500">
                    Solução Definitiva Aplicada
                  </label>
                  <Input
                    placeholder="Ex: Equipamento reparado e testado por 30 minutos em carga."
                    value={serviceSolucao}
                    onChange={(e) => setServiceSolucao(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase text-slate-500">
                    Observações e recomendações ao cliente
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="Ex: Recomendado instalar nobreak na tomada onde fica o servidor."
                    value={serviceObs}
                    onChange={(e) => setServiceObs(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={submittingService}
                    onClick={() => handleRegisterService(false)}
                    className="text-xs"
                  >
                    Registrar Atendimento Parcial
                  </Button>
                  <Button
                    size="sm"
                    disabled={submittingService}
                    onClick={() => handleRegisterService(true)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
                  >
                    FECHAR CHAMADO
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico Cronológico Imutável */}
          <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                Histórico do Chamado (Imutável)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {history.map((item) => (
                  <div key={item.id} className="relative text-xs">
                    <span
                      className={`absolute -left-6 top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-[#1A1E30] ${
                        item.type === 'close'
                          ? 'bg-green-600'
                          : item.type === 'reopen'
                            ? 'bg-amber-500'
                            : item.type === 'service'
                              ? 'bg-blue-600'
                              : 'bg-slate-400'
                      }`}
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.expand?.user?.name || 'Sistema'}
                      </span>
                      <span>
                        {new Date(item.created).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{item.description}</p>
                    {item.service_details && (
                      <div className="mt-2 p-2 rounded bg-slate-50 dark:bg-[#131728] text-[11px] space-y-1 border border-slate-100 dark:border-slate-800">
                        {item.service_details.identificado && (
                          <p>
                            <strong>Identificado:</strong> {item.service_details.identificado}
                          </p>
                        )}
                        {item.service_details.realizado && (
                          <p>
                            <strong>Realizado:</strong> {item.service_details.realizado}
                          </p>
                        )}
                        {item.service_details.solucao && (
                          <p>
                            <strong>Solução:</strong> {item.service_details.solucao}
                          </p>
                        )}
                        {item.service_details.observacoes && (
                          <p>
                            <strong>Observações:</strong> {item.service_details.observacoes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Seção de Mensagens / Chat */}
          <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                Mensagens e Alinhamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-72 overflow-y-auto space-y-3 p-1">
                {messages.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    Nenhuma mensagem registrada. Envie uma observação ou pergunta abaixo.
                  </p>
                ) : (
                  messages.map((m) => {
                    const isMe = m.user === user?.id
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-0.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {m.expand?.user?.name || 'Usuário'}
                          </span>
                          <span>
                            {new Date(m.created).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div
                          className={`p-2.5 rounded-xl max-w-sm text-xs leading-relaxed ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Form envio */}
              <form
                onSubmit={handleSendMessage}
                className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
              >
                <Input
                  placeholder="Escreva uma mensagem para a equipe ou solicitante..."
                  value={newMsgText}
                  onChange={(e) => setNewMsgText(e.target.value)}
                  className="h-9 text-xs"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={sendingMsg || !newMsgText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Metadados do Chamado */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Informações do Chamado
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              {/* Empresa */}
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Empresa</span>
                <div className="mt-0.5 font-bold text-slate-800 dark:text-slate-200">
                  {ticket.expand?.company?.nome_fantasia || 'Pessoa física / sem empresa'}
                </div>
                {isSemContrato && (
                  <span className="inline-block mt-1 text-[10px] font-medium text-sky-500 border border-dashed border-sky-400 rounded px-1.5 py-0.5">
                    Cliente sem contrato
                  </span>
                )}
              </div>

              {/* Solicitante */}
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">
                  Solicitante
                </span>
                <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                  {ticket.expand?.requester?.name || 'Solicitante'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {ticket.expand?.requester?.email || ''}
                </div>
              </div>

              {/* Técnico Responsável */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Técnico Responsável
                  </span>
                  {(isAdmin || isTecnico) && (
                    <button
                      onClick={() => {
                        setSelectedTech(ticket.technician || '')
                        setAssignModalOpen(true)
                      }}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Alterar
                    </button>
                  )}
                </div>
                <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                  {ticket.expand?.technician?.name || 'Nenhum técnico alocado'}
                </div>
              </div>

              {/* Datas */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Aberto em:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {new Date(ticket.opened_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {ticket.scheduled_for && (
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                    <span>Agendado para:</span>
                    <span className="font-mono font-bold">
                      {new Date(ticket.scheduled_for).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}

                {ticket.closed_at && (
                  <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                    <span>Fechado em:</span>
                    <span className="font-mono font-bold">
                      {new Date(ticket.closed_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Alterar Técnico */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Técnico Responsável</DialogTitle>
            <DialogDescription className="text-xs">
              Selecione o técnico para transferir a responsabilidade deste chamado.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Select value={selectedTech} onValueChange={setSelectedTech}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o técnico" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignTechnician} className="bg-blue-600 hover:bg-blue-700">
              Salvar Atribuição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Agendar Visita */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Visita / Atendimento</DialogTitle>
            <DialogDescription className="text-xs">
              Defina a data/hora programada para atendimento presencial ou remoto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Data e Hora Programada</label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Nota ou Instrução do Agendamento</label>
              <Textarea
                placeholder="Ex: Visita na sede do cliente para troca de placa-mãe."
                value={scheduleNote}
                onChange={(e) => setScheduleNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleScheduleConfirm}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              Confirmar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Fechar Chamado */}
      <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar e Fechar Chamado</DialogTitle>
            <DialogDescription className="text-xs">
              Descreva a solução definitiva que resolveu a solicitação do usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-1">
            <label className="text-xs font-semibold">Solução Aplicada *</label>
            <Textarea
              rows={4}
              placeholder="Descreva detalhadamente a ação que solucionou o problema..."
              value={closeSolution}
              onChange={(e) => setCloseSolution(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCloseConfirm}
              disabled={!closeSolution.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Concluir Fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Redefinir Senha do Solicitante (Admin/TI) */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-500" />
              Redefinir Senha do Solicitante
            </DialogTitle>
            <DialogDescription className="text-xs">
              Altere imediatamente a senha de acesso de{' '}
              <strong>{ticket.expand?.requester?.name || 'Solicitante'}</strong> (
              {ticket.expand?.requester?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Nova Senha (mínimo 8 caracteres) *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandomPass}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Gerar senha aleatória
                </button>
              </div>
              <Input
                type="text"
                placeholder="Digite a nova senha ou clique em Gerar"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-9 font-mono text-xs"
              />
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-lg text-[11px] text-blue-800 dark:text-blue-300 space-y-1">
              <strong>Procedimento do T.I.:</strong>
              <p>
                1. Defina a nova senha do usuário.
                <br />
                2. A ação será automaticamente gravada no histórico deste chamado e nos logs de
                auditoria.
                <br />
                3. Copie a senha e informe ao solicitante.
                <br />
                4. Em seguida, utilize o botão "Fechar Chamado" para concluir o atendimento.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={resettingPass}
              onClick={() => setResetModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResetRequesterPassword}
              disabled={resettingPass || !newPassword || newPassword.length < 8}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              {resettingPass ? 'Aplicando...' : 'Aplicar Nova Senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Informativo com a Senha Redefinida para Copiar e Repassar */}
      <Dialog
        open={!!generatedPassResult}
        onOpenChange={(open) => {
          if (!open) setGeneratedPassResult(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Senha Aplicada com Sucesso!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <p className="text-slate-700 dark:text-slate-300">
              A senha do solicitante <strong>{ticket.expand?.requester?.name}</strong> foi
              redefinida no sistema. Repasse a credencial abaixo:
            </p>

            <div className="p-3.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Nova Senha</span>
                <div className="font-mono text-base font-bold text-blue-600 dark:text-blue-400 select-all">
                  {generatedPassResult}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (generatedPassResult) {
                    navigator.clipboard.writeText(generatedPassResult)
                    alert('Senha copiada com sucesso!')
                  }
                }}
                className="text-xs"
              >
                Copiar Senha
              </Button>
            </div>

            <p className="text-[11px] text-slate-500">
              A ação foi registrada no histórico do chamado. Se desejar, agora você pode fechar o
              chamado.
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setGeneratedPassResult(null)}
              className="w-full sm:w-auto"
            >
              Fechar Aviso
            </Button>
            <Button
              onClick={() => {
                setGeneratedPassResult(null)
                setCloseSolution(
                  'Senha de acesso redefinida pela equipe de suporte e repassada ao solicitante.',
                )
                setCloseModalOpen(true)
              }}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Fechar Chamado Agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Reabrir Chamado */}
      <Dialog open={reopenModalOpen} onOpenChange={setReopenModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabertura de Chamado</DialogTitle>
            <DialogDescription className="text-xs">
              Informe a justificativa ou reincidência do problema.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-1">
            <label className="text-xs font-semibold">Motivo da Reabertura *</label>
            <Textarea
              rows={3}
              placeholder="Ex: O problema voltou a ocorrer após o reinício do servidor..."
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleReopenConfirm}
              disabled={!reopenReason.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Reabrir Chamado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Chamado com Filtro de Solicitante por Empresa */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-blue-600" />
              Editar Chamado ({ticket.numero})
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atualize as informações, empresa, solicitante ou prioridade deste chamado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2 text-xs">
            {/* Empresa e Solicitante */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-slate-600 dark:text-slate-300">
                  Empresa / Contratante
                </label>
                {isAdmin || isTecnico ? (
                  <Select value={editCompany} onValueChange={(val) => handleEditCompanyChange(val)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Pessoa Física / Sem empresa</SelectItem>
                      {editCompanies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome_fantasia}{' '}
                          {c.contrato_status === 'Sem contrato' ? '(Sem contrato)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    disabled
                    value={ticket.expand?.company?.nome_fantasia || (ticket.company ? 'Minha Empresa' : 'Pessoa Física / Sem empresa')}
                    className="h-9 text-xs bg-slate-100 dark:bg-slate-800"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-slate-600 dark:text-slate-300">
                  Solicitante <span className="text-red-500">*</span>
                </label>
                {isAdmin || isTecnico ? (
                  !editCompany ? (
                    <div className="flex items-center h-9 px-3 rounded-md border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-400">
                      Selecione uma empresa ou Pessoa Física / Sem empresa
                    </div>
                  ) : loadingEditRequesters ? (
                    <div className="flex items-center h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2 text-blue-600" />
                      Carregando funcionários...
                    </div>
                  ) : editRequestersList.length === 0 ? (
                    <div className="flex items-center h-9 px-3 rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-400">
                      Nenhum usuário cadastrado nesta empresa
                    </div>
                  ) : (
                    <Popover
                      open={editRequesterComboboxOpen}
                      onOpenChange={setEditRequesterComboboxOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={editRequesterComboboxOpen}
                          className={cn(
                            'w-full h-9 justify-between font-normal text-xs px-3',
                            !editRequester && 'text-slate-400',
                          )}
                        >
                          <span className="truncate">
                            {editRequester
                              ? (() => {
                                  const req = editRequestersList.find((u) => u.id === editRequester)
                                  return req
                                    ? `${req.name} (${req.email})`
                                    : 'Selecione o solicitante'
                                })()
                              : 'Selecione ou busque o solicitante...'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Buscar por nome ou e-mail..."
                            className="h-9 text-xs"
                          />
                          <CommandList>
                            <CommandEmpty className="py-4 text-center text-xs text-slate-500">
                              Nenhum solicitante encontrado.
                            </CommandEmpty>
                            <CommandGroup>
                              {editRequestersList.map((u) => (
                                <CommandItem
                                  key={u.id}
                                  value={`${u.name} ${u.email}`}
                                  onSelect={() => {
                                    setEditRequester(u.id)
                                    setEditRequesterComboboxOpen(false)
                                  }}
                                  className="text-xs cursor-pointer flex items-center justify-between py-2"
                                >
                                  <div className="flex flex-col min-w-0 pr-2">
                                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                      {u.name}
                                    </span>
                                    <span className="text-[11px] text-slate-500 truncate">
                                      {u.email}
                                    </span>
                                  </div>
                                  <Check
                                    className={cn(
                                      'h-4 w-4 shrink-0 text-blue-600',
                                      editRequester === u.id ? 'opacity-100' : 'opacity-0',
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )
                ) : (
                  <Input
                    disabled
                    value={user?.name ? `${user.name} (${user.email})` : ''}
                    className="h-9 text-xs bg-slate-100 dark:bg-slate-800"
                  />
                )}
              </div>
            </div>

            {/* Prioridade e Técnico Responsável */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-slate-600 dark:text-slate-300">
                  Prioridade do Atendimento <span className="text-red-500">*</span>
                </label>
                <Select
                  value={editPriority}
                  onValueChange={(val) => setEditPriority(val as TicketPriority)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">🟢 Baixa (Dúvidas, melhorias gerais)</SelectItem>
                    <SelectItem value="Média">🟡 Média (Problema pontual)</SelectItem>
                    <SelectItem value="Alta">🔴 Alta (Impacto crítico ou setor parado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(isAdmin || isTecnico) && (
                <div className="space-y-1.5">
                  <label className="font-semibold uppercase text-slate-600 dark:text-slate-300">
                    Técnico Responsável (Opcional)
                  </label>
                  <Select value={editTechnician} onValueChange={(val) => setEditTechnician(val)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Distribuir depois na triagem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (Triagem da equipe)</SelectItem>
                      {technicians.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Título */}
            <div className="space-y-1.5">
              <label className="font-semibold uppercase text-slate-600 dark:text-slate-300">
                Título do Problema ou Solicitação <span className="text-red-500">*</span>
              </label>
              <Input
                required
                maxLength={200}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <label className="font-semibold uppercase text-slate-600 dark:text-slate-300">
                Descrição Detalhada do Problema <span className="text-red-500">*</span>
              </label>
              <Textarea
                required
                rows={4}
                maxLength={3000}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                {savingEdit ? 'Salvando Alterações...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default TicketDetail
