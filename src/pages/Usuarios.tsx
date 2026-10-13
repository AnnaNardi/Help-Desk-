import React, { useState, useEffect, useMemo } from 'react'
import { userService } from '@/services/users'
import { companyService } from '@/services/companies'
import { User, Company, UserRole } from '@/types/helpdesk'
import pb from '@/lib/api/client'
import { PlusCircle, Search, Key, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { ResponsivePagination, useResponsivePageSize } from '@/components/ResponsivePagination'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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

export const Usuarios: React.FC = () => {
  const pageSize = useResponsivePageSize()
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterCompany, setFilterCompany] = useState('all')

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('Usuario')
  const [company, setCompany] = useState<string>('')
  const [phone, setPhone] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  // Reset password modal
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [generatedPassAlert, setGeneratedPassAlert] = useState<{
    userName: string
    password: string
  } | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [allU, allC] = await Promise.all([userService.getAll(), companyService.getAll()])
      setUsers(allU)
      setCompanies(allC)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    setEditingUser(null)
    setName('')
    setEmail('')
    setRole('Usuario')
    setCompany(companies[0]?.id || '')
    setPhone('')
    setAtivo(true)
    setPassword('')
    setModalOpen(true)
  }

  const handleOpenEdit = (u: User) => {
    setEditingUser(u)
    setName(u.name)
    setEmail(u.email)
    setRole(u.role)
    setCompany(u.company || '')
    setPhone(u.phone || '')
    setAtivo(u.ativo !== false)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) return
    setSaving(true)
    try {
      if (editingUser) {
        await userService.update(editingUser.id, {
          name,
          email,
          role,
          company: company || undefined,
          phone,
          ativo,
        })
      } else {
        await userService.create({
          name,
          email,
          role,
          company: company || undefined,
          phone,
          ativo,
          password,
        })
      }
      setModalOpen(false)
      await loadData()
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      alert('Erro ao salvar usuário: ' + errorObj.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (u: User) => {
    try {
      await userService.toggleActive(u.id, u.ativo !== false)
      await loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (u: User) => {
    if (!confirm(`Deseja realmente remover o usuário ${u.name}?`)) return
    try {
      await userService.delete(u.id)
      await loadData()
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      alert(
        'Não foi possível excluir o usuário (pode haver vínculos de chamados): ' + errorObj.message,
      )
    }
  }

  const handleGenerateRandomPass = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
    let res = ''
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(res)
  }

  const handleResetPassword = async () => {
    if (!resetTargetUser || !newPassword) return
    if (newPassword.length < 8) {
      alert('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }
    setResetting(true)
    try {
      const res = await userService.adminResetPassword(resetTargetUser.id, newPassword)
      setResetModalOpen(false)
      setGeneratedPassAlert({
        userName: resetTargetUser.name,
        password: newPassword,
      })
      setNewPassword('')
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      alert('Erro ao redefinir senha: ' + (errorObj.message || 'Falha na requisição'))
    } finally {
      setResetting(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [search, filterCompany])

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesCompany = filterCompany === 'all' || u.company === filterCompany
    return matchesSearch && matchesCompany
  })

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, page, pageSize])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Usuários e Acessos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gerenciamento de contas, perfis de permissão e empresas vinculadas
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          <PlusCircle className="h-4 w-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      {/* Filter and Search */}
      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

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
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#131728] border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="py-3 px-4">Nome do Usuário</th>
                  <th className="py-3 px-3">E-mail / Login</th>
                  <th className="py-3 px-3">Empresa</th>
                  <th className="py-3 px-3">Perfil</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{u.name}</div>
                      {u.phone && <div className="text-[11px] text-slate-400">{u.phone}</div>}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono">
                      {u.email}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {u.expand?.company?.nome_fantasia || 'Sem vínculo'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          u.role === 'Admin'
                            ? 'default'
                            : u.role === 'Tecnico'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.ativo !== false
                            ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        }`}
                      >
                        {u.ativo !== false ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(u)}
                        className="h-7 text-xs"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setResetTargetUser(u)
                          setNewPassword('')
                          setResetModalOpen(true)
                        }}
                        className="h-7 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      >
                        <Key className="h-3.5 w-3.5 mr-1" />
                        Redefinir Senha
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(u)}
                        className="h-7 w-7 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3">
            <ResponsivePagination
              currentPage={page}
              totalItems={filteredUsers.length}
              pageSize={pageSize}
              onPageChange={setPage}
              itemName="usuários"
            />
          </div>
        </CardContent>
      </Card>

      {/* Modal Criar/Editar Usuário */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold uppercase text-slate-500 dark:text-slate-300">Nome Completo *</label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-slate-500 dark:text-slate-300">E-mail de Login *</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {!editingUser && (
              <div className="space-y-1">
                <label className="font-semibold uppercase text-slate-500 dark:text-slate-300">Senha Inicial *</label>
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  className="h-8 text-xs"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-slate-500 dark:text-slate-300">Perfil de Acesso *</label>
                <Select value={role} onValueChange={(val) => setRole(val as UserRole)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Usuario">Usuário (Cliente)</SelectItem>
                    <SelectItem value="Tecnico">Técnico de Suporte</SelectItem>
                    <SelectItem value="Admin">Administrador / T.I.</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-slate-500 dark:text-slate-300">Telefone / Ramal</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 90000-0000"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-slate-500 dark:text-slate-300">Empresa Vinculada</label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem empresa (Pessoa física)</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome_fantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                O perfil continua sendo Usuário (Cliente); sem empresa, o chamado será registrado como pessoa física.
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch checked={ativo} onCheckedChange={setAtivo} />
              <label className="font-medium">Usuário ativo no sistema</label>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? 'Salvando...' : 'Salvar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Redefinir Senha pelo Admin */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-500" />
              Redefinir Senha de Usuário
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Você está redefinindo a senha de acesso de:{' '}
              <strong className="text-slate-900 dark:text-white">
                {resetTargetUser?.name}
              </strong> (
              {resetTargetUser?.email}).
            </p>

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
                placeholder="Ex: Central@2025 ou clique em Gerar"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-9 font-mono text-xs"
              />
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              <strong>Importante:</strong>
              <p>
                A nova senha será aplicada imediatamente. Uma notificação interna será enviada ao
                usuário e a ação será registrada nos logs de auditoria. Você receberá a senha em
                tela para repassar ao usuário.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={resetting} onClick={() => setResetModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetting || !newPassword || newPassword.length < 8}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {resetting ? 'Aplicando...' : 'Aplicar Nova Senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Informativo com a Nova Senha Gerada para Repasse */}
      <Dialog
        open={!!generatedPassAlert}
        onOpenChange={(open) => {
          if (!open) setGeneratedPassAlert(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Senha Redefinida com Sucesso!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <p className="text-slate-700 dark:text-slate-300">
              A nova senha de acesso para <strong>{generatedPassAlert?.userName}</strong> foi
              aplicada no sistema. Repasse a credencial abaixo para o usuário:
            </p>

            <div className="p-3.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Nova Senha</span>
                <div className="font-mono text-base font-bold text-blue-600 dark:text-blue-400 select-all">
                  {generatedPassAlert?.password}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (generatedPassAlert?.password) {
                    navigator.clipboard.writeText(generatedPassAlert.password)
                    alert('Senha copiada para a área de transferência!')
                  }
                }}
                className="text-xs"
              >
                Copiar Senha
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setGeneratedPassAlert(null)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default Usuarios
