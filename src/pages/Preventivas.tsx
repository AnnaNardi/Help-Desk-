import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { preventivaService } from '@/services/preventivas'
import { companyService } from '@/services/companies'
import { userService } from '@/services/users'
import { Preventiva, Company, User, PreventivaStatus } from '@/types/helpdesk'
import pb from '@/lib/api/client'
import {
  CalendarCheck2,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Edit2,
  Trash2,
  AlertTriangle,
  Building,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ResponsivePagination, useResponsivePageSize } from '@/components/ResponsivePagination'

export const Preventivas: React.FC = () => {
  const { user } = useAuth()
  const pageSize = useResponsivePageSize()
  const [preventivas, setPreventivas] = useState<Preventiva[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  // Filters
  const [filterCompany, setFilterCompany] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formCompany, setFormCompany] = useState('')
  const [formTech, setFormTech] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formStatus, setFormStatus] = useState<PreventivaStatus>('Agendada')
  const [formObs, setFormObs] = useState('')
  const [saving, setSaving] = useState(false)

  const role = user?.role || 'Usuario'
  const isAdmin = role === 'Admin'
  const isTecnico = role === 'Tecnico'

  const loadData = async () => {
    try {
      setLoading(true)
      const [allP, allC, allT] = await Promise.all([
        preventivaService.getAll({
          company: filterCompany,
          status: filterStatus,
        }),
        companyService.getAll(),
        userService.getTechnicians(),
      ])
      setPreventivas(allP)
      setCompanies(allC)
      setTechnicians(allT)
    } catch (err) {
      console.error('Erro ao buscar preventivas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [filterCompany, filterStatus])

  useEffect(() => {
    loadData()
    const unsub = pb.collection('preventivas').subscribe('*', () => {
      loadData()
    })
    return () => {
      pb.collection('preventivas').unsubscribe('*')
    }
  }, [filterCompany, filterStatus])

  const paginatedPreventivas = useMemo(() => {
    const start = (page - 1) * pageSize
    return preventivas.slice(start, start + pageSize)
  }, [preventivas, page, pageSize])

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormCompany(companies[0]?.id || '')
    setFormTech(technicians[0]?.id || '')
    setFormDesc('')
    setFormDate(new Date().toISOString().slice(0, 16))
    setFormStatus('Agendada')
    setFormObs('')
    setModalOpen(true)
  }

  const handleOpenEdit = (p: Preventiva) => {
    setEditingId(p.id)
    setFormCompany(p.company)
    setFormTech(p.technician)
    setFormDesc(p.description)
    setFormDate(new Date(p.scheduled_date).toISOString().slice(0, 16))
    setFormStatus(p.status)
    setFormObs(p.observations || '')
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formDesc || !formCompany || !formTech || !formDate) return
    setSaving(true)
    try {
      const payload = {
        company: formCompany,
        technician: formTech,
        description: formDesc,
        scheduled_date: new Date(formDate).toISOString(),
        status: formStatus,
        observations: formObs,
      }

      if (editingId) {
        await preventivaService.update(editingId, payload)
      } else {
        await preventivaService.create(payload)
      }
      setModalOpen(false)
      await loadData()
    } catch (err) {
      console.error('Erro ao salvar preventiva:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id: string, status: PreventivaStatus) => {
    try {
      await preventivaService.updateStatus(id, status)
      await loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este agendamento de preventiva?')) return
    try {
      await preventivaService.delete(id)
      await loadData()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Manutenções Preventivas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rotinas periódicas de infraestrutura, servidores e segurança lógica
          </p>
        </div>

        {(isAdmin || isTecnico) && (
          <Button
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Nova Preventiva
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="w-56">
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Empresa: Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome_fantasia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Status: Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Agendada">Agendada</SelectItem>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">Carregando preventivas...</div>
        ) : preventivas.length === 0 ? (
          <Card className="bg-white dark:bg-[#1A1E30] text-center py-16 border-slate-200 dark:border-slate-800">
            <CardContent>
              <CalendarCheck2 className="h-10 w-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold">Nenhuma preventiva programada</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {paginatedPreventivas.map((p) => {
              const isSoon =
                p.status === 'Agendada' &&
                new Date(p.scheduled_date).getTime() - Date.now() < 48 * 3600 * 1000 &&
                new Date(p.scheduled_date).getTime() > Date.now()

              return (
                <Card
                  key={p.id}
                  className={`bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800 ${
                    isSoon ? 'border-l-4 border-l-amber-500 shadow-sm' : ''
                  }`}
                >
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {p.description}
                        </span>
                        {isSoon && (
                          <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Próxima (48h)
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <Building className="h-3.5 w-3.5 text-blue-600" />
                          {p.expand?.company?.nome_fantasia || 'Empresa'}
                        </span>
                        <span>•</span>
                        <span>Técnico: {p.expand?.technician?.name || 'Técnico'}</span>
                        <span>•</span>
                        <span>
                          Data:{' '}
                          {new Date(p.scheduled_date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {p.observations && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                          Obs: {p.observations}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        className={
                          p.status === 'Concluída'
                            ? 'bg-green-600'
                            : p.status === 'Em andamento'
                              ? 'bg-amber-500'
                              : p.status === 'Cancelada'
                                ? 'bg-red-500'
                                : 'bg-blue-600'
                        }
                      >
                        {p.status}
                      </Badge>

                      {(isAdmin || isTecnico) && (
                        <div className="flex items-center gap-1">
                          {p.status === 'Agendada' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusChange(p.id, 'Em andamento')}
                              className="h-8 text-xs text-amber-600"
                              title="Iniciar"
                            >
                              <Play className="h-3.5 w-3.5 mr-1" /> Iniciar
                            </Button>
                          )}
                          {p.status === 'Em andamento' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusChange(p.id, 'Concluída')}
                              className="h-8 text-xs text-green-600 font-bold"
                              title="Concluir"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Concluir
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEdit(p)}
                            className="h-8 w-8 text-slate-500"
                            title="Editar"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          {isAdmin && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(p.id)}
                              className="h-8 w-8 text-red-500"
                              title="Excluir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            <ResponsivePagination
              currentPage={page}
              totalItems={preventivas.length}
              pageSize={pageSize}
              onPageChange={setPage}
              itemName="manutenções preventivas"
            />
          </>
        )}
      </div>

      {/* Modal Criar/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Manutenção Preventiva' : 'Nova Manutenção Preventiva'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Empresa Contratante *</label>
              <Select value={formCompany} onValueChange={setFormCompany}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome_fantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Técnico Responsável *</label>
              <Select value={formTech} onValueChange={setFormTech}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
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

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Descrição da Rotina Preventiva *</label>
              <Input
                required
                placeholder="Ex: Auditoria mensal de backups e teste de failover"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Data e Hora *</label>
                <Input
                  type="datetime-local"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Status *</label>
                <Select
                  value={formStatus}
                  onValueChange={(val) => setFormStatus(val as PreventivaStatus)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Agendada">Agendada</SelectItem>
                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Observações / Checklist</label>
              <Textarea
                rows={3}
                placeholder="Pontos específicos a serem verificados no cliente..."
                value={formObs}
                onChange={(e) => setFormObs(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? 'Salvando...' : 'Salvar Preventiva'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default Preventivas
