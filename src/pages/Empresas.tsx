import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { companyService } from '@/services/companies'
import { ticketService } from '@/services/tickets'
import { userService } from '@/services/users'
import { Company } from '@/types/helpdesk'
import pb from '@/lib/api/client'
import {
  PlusCircle,
  Search,
  Users,
  Ticket as TicketIcon,
  Edit2,
  Trash2,
  AlertTriangle,
  Building2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ResponsivePagination, useResponsivePageSize } from '@/components/ResponsivePagination'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export const Empresas: React.FC = () => {
  const navigate = useNavigate()
  const pageSize = useResponsivePageSize()
  const [companies, setCompanies] = useState<Company[]>([])
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({})
  const [userCounts, setUserCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Modal Create/Edit
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)

  // Delete modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Form states
  const [razaoSocial, setRazaoSocial] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('SP')
  const [cep, setCep] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [contratoStatus, setContratoStatus] = useState<'Ativo' | 'Inativo' | 'Sem contrato'>(
    'Ativo',
  )
  const [ativo, setAtivo] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [allC, allT, allU] = await Promise.all([
        companyService.getAll(),
        ticketService.getAllTickets(),
        userService.getAll(),
      ])

      const tMap: Record<string, number> = {}
      allT.forEach((t) => {
        tMap[t.company] = (tMap[t.company] || 0) + 1
      })

      const uMap: Record<string, number> = {}
      allU.forEach((u) => {
        if (u.company) {
          uMap[u.company] = (uMap[u.company] || 0) + 1
        }
      })

      setCompanies(allC)
      setTicketCounts(tMap)
      setUserCounts(uMap)
    } catch (err) {
      console.error('Erro ao carregar empresas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    setEditingCompany(null)
    setRazaoSocial('')
    setNomeFantasia('')
    setCnpj('')
    setTelefone('')
    setEmail('')
    setEndereco('')
    setCidade('São Paulo')
    setUf('SP')
    setCep('')
    setResponsavel('')
    setContratoStatus('Ativo')
    setAtivo(true)
    setModalOpen(true)
  }

  const handleOpenEdit = (c: Company) => {
    setEditingCompany(c)
    setRazaoSocial(c.razao_social)
    setNomeFantasia(c.nome_fantasia)
    setCnpj(c.cnpj || '')
    setTelefone(c.telefone || '')
    setEmail(c.email || '')
    setEndereco(c.endereco || '')
    setCidade(c.cidade || 'São Paulo')
    setUf(c.uf || 'SP')
    setCep(c.cep || '')
    setResponsavel(c.responsavel || '')
    setContratoStatus(c.contrato_status)
    setAtivo(c.ativo !== false)
    setModalOpen(true)
  }

  const isStructuralCompany = (c: Company) => {
    const nome = (c.nome_fantasia || '').trim().toLowerCase()
    return (
      nome === 'organização interna' ||
      nome === 'organizacao interna' ||
      nome === 'clientes sem contrato' ||
    )
  }

  const handleOpenDelete = (c: Company) => {
    if (isStructuralCompany(c)) {
      alert('Esta empresa é estrutural do sistema e não pode ser excluída.')
      return
    }
    setCompanyToDelete(c)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return
    setDeleting(true)
    try {
      await companyService.delete(companyToDelete.id)
      setDeleteDialogOpen(false)
      setCompanyToDelete(null)
      await loadData()
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      alert('Erro ao excluir empresa: ' + (errorObj.message || 'Falha na exclusão'))
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!razaoSocial || !nomeFantasia) return
    setSaving(true)
    try {
      const data = {
        razao_social: razaoSocial,
        nome_fantasia: nomeFantasia,
        cnpj,
        telefone,
        email,
        endereco,
        cidade,
        uf,
        cep,
        responsavel,
        contrato_status: contratoStatus,
        ativo,
      }

      if (editingCompany) {
        await companyService.update(editingCompany.id, data)
      } else {
        await companyService.create(data)
      }
      setModalOpen(false)
      await loadData()
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar empresa.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [search])

  const visibleCompanies = useMemo(() => {
    return companies.filter((c) => !isStructuralCompany(c))
  }, [companies])

  const filtered = visibleCompanies.filter(
    (c) =>
      c.nome_fantasia.toLowerCase().includes(search.toLowerCase()) ||
      c.razao_social.toLowerCase().includes(search.toLowerCase()) ||
      (c.cnpj && c.cnpj.includes(search)),
  )

  const paginatedCompanies = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Empresas e Contratos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestão de empresas clientes, filiais e clientes sem contrato
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
        >
          <PlusCircle className="h-4 w-4 mr-2" /> Cadastrar Empresa
        </Button>
      </div>

      {/* Search Input */}
      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome fantasia, razão social ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid of Company Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedCompanies.map((c) => {
          const isSemContr = c.contrato_status === 'Sem contrato'
          const tCount = ticketCounts[c.id] || 0
          const uCount = userCounts[c.id] || 0

          return (
            <Card
              key={c.id}
              className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                      {c.nome_fantasia}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{c.razao_social}</p>
                  </div>
                  {isSemContr ? (
                    <span className="text-[10px] font-medium text-sky-500 border border-dashed border-sky-400 rounded px-2 py-0.5 shrink-0">
                      Sem contrato
                    </span>
                  ) : (
                    <Badge
                      variant={c.contrato_status === 'Ativo' ? 'default' : 'destructive'}
                      className="shrink-0 text-[10px]"
                    >
                      {c.contrato_status}
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  {c.cnpj && (
                    <p>
                      <strong>CNPJ:</strong> {c.cnpj}
                    </p>
                  )}
                  {c.responsavel && (
                    <p>
                      <strong>Contato:</strong> {c.responsavel}
                    </p>
                  )}
                  {c.telefone && (
                    <p>
                      <strong>Telefone:</strong> {c.telefone}
                    </p>
                  )}
                  {c.cidade && (
                    <p>
                      <strong>Local:</strong> {c.cidade} - {c.uf}
                    </p>
                  )}
                </div>

                {/* Metrics */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>{uCount} usuários</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <TicketIcon className="h-4 w-4 text-amber-500" />
                    <span>{tCount} chamados</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDelete(c)}
                    className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                    title="Excluir empresa"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(c)}
                    className="h-8 text-xs"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800 p-8 text-center">
          <Building2 className="h-10 w-10 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
            Nenhuma empresa encontrada
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {search
              ? 'Tente ajustar os termos de busca.'
              : 'Clique em "Cadastrar Empresa" para adicionar um novo cliente.'}
          </p>
        </Card>
      )}

      <ResponsivePagination
        currentPage={page}
        totalItems={filtered.length}
        pageSize={pageSize}
        onPageChange={setPage}
        itemName="empresas"
      />

      {/* Modal Criar/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white font-bold">
              {editingCompany ? 'Editar Dados da Empresa' : 'Cadastrar Nova Empresa'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Preencha os dados cadastrais da empresa cliente. O CNPJ é opcional.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-[11px] text-slate-700 dark:text-slate-200 tracking-wide">
                  Nome Fantasia <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Nome fantasia da empresa"
                  className="h-9 text-xs bg-white dark:bg-[#131728] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-[11px] text-slate-700 dark:text-slate-200 tracking-wide">
                  Razão Social <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Razão social completa"
                  className="h-9 text-xs bg-white dark:bg-[#131728] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-[11px] text-slate-700 dark:text-slate-200 tracking-wide">
                  CNPJ{' '}
                  <span className="text-[10px] lowercase font-normal text-slate-500 dark:text-slate-400">
                    (opcional)
                  </span>
                </label>
                <Input
                  placeholder="00.000.000/0001-00 (opcional)"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-[#131728] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-[11px] text-slate-700 dark:text-slate-200 tracking-wide">
                  Telefone Principal
                </label>
                <Input
                  placeholder="(11) 3000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-[#131728] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-[11px] text-slate-700 dark:text-slate-200 tracking-wide">
                  E-mail Comercial/Suporte
                </label>
                <Input
                  type="email"
                  placeholder="contato@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-[#131728] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-[11px] text-slate-700 dark:text-slate-200 tracking-wide">
                  Responsável / Contato
                </label>
                <Input
                  placeholder="Nome do contato principal"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-[#131728] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold uppercase text-[11px] text-slate-700 dark:text-slate-200 tracking-wide">
                Endereço Completo
              </label>
              <Input
                placeholder="Rua, número, complemento, bairro"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="h-9 text-xs bg-white dark:bg-[#131728] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-[11px] text-slate-700 dark:text-slate-200 tracking-wide">
                  Cidade
                </label>
                <Input
                  placeholder="Cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-[#131728] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-[11px] text-slate-700 dark:text-slate-200 tracking-wide">
                  UF
                </label>
                <Input
                  maxLength={2}
                  placeholder="UF"
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  className="h-9 text-xs uppercase bg-white dark:bg-[#131728] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-[11px] text-slate-700 dark:text-slate-200 tracking-wide">
                  CEP
                </label>
                <Input
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-[#131728] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-[11px] text-slate-700 dark:text-slate-200 tracking-wide">
                  Status do Contrato
                </label>
                <Select
                  value={contratoStatus}
                  onValueChange={(val) => setContratoStatus(val as any)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white dark:bg-[#131728] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                    <SelectItem value="Ativo">Ativo (Mensalista SLA)</SelectItem>
                    <SelectItem value="Inativo">Inativo (Suspenso)</SelectItem>
                    <SelectItem value="Sem contrato">Sem contrato (Avulso)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch checked={ativo} onCheckedChange={setAtivo} />
                <label className="font-medium text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                  Empresa ativa no sistema
                </label>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                {saving ? 'Salvando...' : 'Salvar Empresa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Confirmação de Exclusão de Empresa */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <AlertDialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Excluir Empresa
                </AlertDialogTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  {companyToDelete?.nome_fantasia}
                </p>
              </div>
            </div>
            <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-300 pt-2 space-y-2">
              <p>
                Tem certeza de que deseja excluir permanentemente a empresa{' '}
                <strong className="text-slate-900 dark:text-white">
                  {companyToDelete?.nome_fantasia}
                </strong>
                ?
              </p>
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg text-red-800 dark:text-red-300 space-y-1">
                <strong>Atenção aos impactos:</strong>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Usuários vinculados a esta empresa perderão o vínculo corporativo.</li>
                  <li>
                    Chamados e manutenções preventivas vinculados a ela serão afetados ou
                    bloqueados.
                  </li>
                  <li>Esta ação não poderá ser desfeita.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel
              disabled={deleting}
              onClick={() => {
                setCompanyToDelete(null)
                setDeleteDialogOpen(false)
              }}
              className="text-xs"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold focus:ring-red-600"
            >
              {deleting ? 'Excluindo...' : 'Sim, Excluir Empresa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
export default Empresas
