import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ticketService } from '@/services/tickets'
import { companyService } from '@/services/companies'
import { userService } from '@/services/users'
import { Company, User, TicketPriority } from '@/types/helpdesk'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  ClipboardList,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Check,
  ChevronsUpDown,
  User as UserIcon,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const TicketCreate: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [companies, setCompanies] = useState<Company[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [requestersList, setRequestersList] = useState<User[]>([])
  const [loadingRequesters, setLoadingRequesters] = useState(false)
  const [requesterComboboxOpen, setRequesterComboboxOpen] = useState(false)

  const role = user?.role || 'Usuario'
  const isAdmin = role === 'Admin'
  const isTecnico = role === 'Tecnico'
  const canSelectCompany = isAdmin || isTecnico

  const [selectedCompany, setSelectedCompany] = useState<string>(() => {
    if (canSelectCompany) {
      return searchParams.get('company') || ''
    }
    return user?.company || ''
  })
  const [selectedRequester, setSelectedRequester] = useState<string>(() => {
    if (!canSelectCompany) {
      return user?.id || ''
    }
    return ''
  })
  const [selectedTechnician, setSelectedTechnician] = useState<string>('none')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('Média')

  // Carrega lista inicial de empresas e técnicos (para Admin e Técnico)
  useEffect(() => {
    const loadInitialMeta = async () => {
      try {
        if (canSelectCompany) {
          const [comps, techs] = await Promise.all([
            companyService.getAll(),
            userService.getTechnicians(),
          ])
          setCompanies(comps)
          setTechnicians(techs)
        }
      } catch (err) {
        console.error('Erro ao carregar dados p/ criação:', err)
      }
    }
    loadInitialMeta()
  }, [canSelectCompany])

  // Carrega solicitantes filtrados no servidor por company = empresa selecionada
  useEffect(() => {
    if (!canSelectCompany) {
      // Usuário comum: solicitante é sempre o usuário logado
      return
    }

    if (!selectedCompany) {
      setRequestersList([])
      setSelectedRequester('')
      return
    }

    let isCurrent = true
    setLoadingRequesters(true)

    const requestersRequest = selectedCompany === 'none'
      ? userService.getWithoutCompany()
      : userService.getByCompany(selectedCompany)

    requestersRequest
      .then((users) => {
        if (!isCurrent) return
        setRequestersList(users)

        // Se o solicitante anteriormente selecionado não pertencer à nova empresa, reseta
        setSelectedRequester((prev) => {
          if (prev && users.some((u) => u.id === prev)) {
            return prev
          }
          return ''
        })
      })
      .catch((err) => {
        console.error('Erro ao carregar funcionários da empresa:', err)
        if (isCurrent) {
          setRequestersList([])
          setSelectedRequester('')
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoadingRequesters(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [selectedCompany, canSelectCompany])

  const handleCompanyChange = (newCompanyId: string) => {
    setSelectedCompany(newCompanyId)
    // Limpa imediatamente o solicitante previamente escolhido
    setSelectedRequester('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (canSelectCompany && !selectedCompany) {
      setError('Selecione uma empresa ou Pessoa Física / Sem empresa.')
      return
    }
    const compId = canSelectCompany
      ? selectedCompany === 'none' ? null : selectedCompany
      : user?.company || null

    const requesterId = canSelectCompany ? selectedRequester : user?.id
    if (!requesterId) {
      setError('Por favor, selecione o solicitante do chamado.')
      return
    }

    if (!title.trim() || !description.trim()) {
      setError('Por favor, preencha o título e a descrição da solicitação.')
      return
    }

    setLoading(true)

    try {
      const created = await ticketService.create({
        company: compId,
        requester: requesterId,
        technician: selectedTechnician !== 'none' ? selectedTechnician : undefined,
        title: title.trim(),
        description: description.trim(),
        priority,
      })

      navigate(`/chamados/${created.id}`)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setError(errorObj.message || 'Erro ao criar chamado. Verifique os dados.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-xs text-slate-500"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Abertura de Chamado
          </h1>
          <p className="text-xs text-slate-500">
            Preencha os detalhes do incidente ou solicitação técnica.
          </p>
        </div>
      </div>

      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800 shadow-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              Dados do Chamado
            </CardTitle>
            <CardDescription className="text-xs">
              O número de protocolo sequencial (#NNNN) será gerado automaticamente pelo servidor.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Empresa e Solicitante (Selecionável p/ Admin/TI) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                  Empresa / Contratante
                </label>
                {canSelectCompany ? (
                  <Select value={selectedCompany} onValueChange={(val) => handleCompanyChange(val)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Selecione a empresa ou pessoa física" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Pessoa Física / Sem empresa</SelectItem>
                      {companies.map((c) => (
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
                    value={user?.expand?.company?.nome_fantasia || (user?.company ? 'Minha Empresa' : 'Pessoa Física / Sem empresa')}
                    className="h-9 text-xs bg-slate-100 dark:bg-slate-800"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                  Solicitante <span className="text-red-500">*</span>
                </label>
                {canSelectCompany ? (
                  !selectedCompany ? (
                    <div className="flex items-center h-9 px-3 rounded-md border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-400">
                      Selecione uma empresa ou Pessoa Física / Sem empresa
                    </div>
                  ) : loadingRequesters ? (
                    <div className="flex items-center h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2 text-blue-600" />
                      Carregando funcionários...
                    </div>
                  ) : requestersList.length === 0 ? (
                    <div className="flex items-center h-9 px-3 rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-400">
                      Nenhum usuário cadastrado nesta empresa
                    </div>
                  ) : (
                    <Popover open={requesterComboboxOpen} onOpenChange={setRequesterComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={requesterComboboxOpen}
                          className={cn(
                            'w-full h-9 justify-between font-normal text-xs px-3',
                            !selectedRequester && 'text-slate-400',
                          )}
                        >
                          <span className="truncate">
                            {selectedRequester
                              ? (() => {
                                  const req = requestersList.find((u) => u.id === selectedRequester)
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
                              {requestersList.map((u) => (
                                <CommandItem
                                  key={u.id}
                                  value={`${u.name} ${u.email}`}
                                  onSelect={() => {
                                    setSelectedRequester(u.id)
                                    setRequesterComboboxOpen(false)
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
                                      selectedRequester === u.id ? 'opacity-100' : 'opacity-0',
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
                <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                  Prioridade do Atendimento <span className="text-red-500">*</span>
                </label>
                <Select
                  value={priority}
                  onValueChange={(val) => setPriority(val as TicketPriority)}
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
                  <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                    Técnico Responsável (Opcional)
                  </label>
                  <Select
                    value={selectedTechnician}
                    onValueChange={(val) => setSelectedTechnician(val)}
                  >
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
              <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                Título do Problema ou Solicitação <span className="text-red-500">*</span>
              </label>
              <Input
                required
                maxLength={200}
                placeholder="Ex: Falha na emissão de nota fiscal eletrônica"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                Descrição Detalhada do Problema <span className="text-red-500">*</span>
              </label>
              <Textarea
                required
                rows={5}
                maxLength={3000}
                placeholder="Descreva detalhadamente o ocorrido, mensagens de erro, computadores ou setores afetados..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs"
              />
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Registrando chamado...
                </>
              ) : (
                'Criar Chamado'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
export default TicketCreate
