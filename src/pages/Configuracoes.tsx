import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import pb from '@/lib/api/client'
import {
  Settings,
  User,
  Palette,
  Shield,
  Key,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'

export const Configuracoes: React.FC = () => {
  const { user, refreshUser, theme, setTheme } = useAuth()

  // Profile fields
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Email change
  const [newEmail, setNewEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState<string | null>(null)

  // Password change
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

  // Admin settings toggles
  const [notifTicketCreate, setNotifTicketCreate] = useState(true)
  const [notifTicketStatus, setNotifTicketStatus] = useState(true)
  const [notifPreventiva, setNotifPreventiva] = useState(true)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingProfile(true)
    setProfileSuccess(false)
    try {
      await pb.collection('users').update(user.id, {
        name,
        phone,
      })
      await refreshUser()
      setProfileSuccess(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) return
    try {
      await pb.collection('users').requestEmailChange(newEmail.trim())
      setEmailMsg('E-mail atualizado com sucesso.')
      setNewEmail('')
      await refreshUser()
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setEmailMsg('Erro: ' + errorObj.message)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordMsg('A nova senha e a confirmação não coincidem.')
      return
    }
    if (!user) return
    try {
      await pb.collection('users').update(user.id, {
        oldPassword,
        password: newPassword,
        passwordConfirm: confirmPassword,
      })
      setPasswordMsg('Senha alterada com sucesso!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setPasswordMsg('Erro: ' + errorObj.message)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Configurações do Sistema
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Gerenciamento de perfil individual, preferências visuais e parâmetros do help desk
        </p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-4">
        <TabsList className="bg-white dark:bg-[#1A1E30] border border-slate-200 dark:border-slate-800 p-1">
          <TabsTrigger value="perfil" className="text-xs">
            <User className="h-3.5 w-3.5 mr-1.5" /> Meu Perfil
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="text-xs">
            <Palette className="h-3.5 w-3.5 mr-1.5" /> Aparência e Tema
          </TabsTrigger>
          {user?.role === 'Admin' && (
            <TabsTrigger value="admin" className="text-xs">
              <Shield className="h-3.5 w-3.5 mr-1.5" /> Parâmetros do Help Desk
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab Perfil */}
        <TabsContent value="perfil" className="space-y-4">
          <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Informações Básicas</CardTitle>
              <CardDescription className="text-xs">
                Atualize seus dados cadastrais de contato e exibição.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-3">
                {profileSuccess && (
                  <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg flex items-center gap-2 border border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Perfil atualizado com sucesso!</span>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Nome Completo</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Telefone / WhatsApp</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="text-xs bg-blue-600 hover:bg-blue-700"
                >
                  {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Trocar E-mail */}
          <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                Alterar Endereço de E-mail
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleRequestEmailChange}>
              <CardContent className="space-y-3">
                {emailMsg && (
                  <div className="p-2 text-xs bg-slate-100 dark:bg-slate-800 rounded">
                    {emailMsg}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-semibold">E-mail Atual</label>
                  <Input
                    disabled
                    value={user?.email || ''}
                    className="h-8 text-xs bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Novo E-mail</label>
                  <Input
                    type="email"
                    required
                    placeholder="novo.email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" variant="outline" className="text-xs">
                  Solicitar Alteração de E-mail
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Trocar Senha */}
          <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-500" />
                Segurança e Senha
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-3">
                {passwordMsg && (
                  <div className="p-2 text-xs bg-slate-100 dark:bg-slate-800 rounded">
                    {passwordMsg}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Senha Atual</label>
                  <Input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Nova Senha</label>
                    <Input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Confirmar Nova Senha</label>
                    <Input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" variant="outline" className="text-xs">
                  Atualizar Minha Senha
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Tab Aparência */}
        <TabsContent value="aparencia">
          <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Tema da Aplicação</CardTitle>
              <CardDescription className="text-xs">
                A preferência é salva individualmente e preservada a cada acesso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setTheme('claro')}
                  className={`p-4 rounded-xl border-2 cursor-pointer text-center space-y-2 transition-all ${
                    theme === 'claro'
                      ? 'border-blue-600 bg-blue-50/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="h-12 w-full rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-800">
                    Modo Claro
                  </div>
                  <p className="text-xs font-semibold">Tema Claro (Fundo suave #F6F7FB)</p>
                </div>

                <div
                  onClick={() => setTheme('escuro')}
                  className={`p-4 rounded-xl border-2 cursor-pointer text-center space-y-2 transition-all ${
                    theme === 'escuro'
                      ? 'border-blue-600 bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="h-12 w-full rounded bg-[#0F1222] border border-[#2A2F45] flex items-center justify-center font-bold text-xs text-white">
                    Modo Escuro
                  </div>
                  <p className="text-xs font-semibold">Tema Escuro (Deep Navy #0F1222)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Admin Parameters */}
        {user?.role === 'Admin' && (
          <TabsContent value="admin">
            <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm font-bold">
                  Parâmetros Operacionais de Notificação
                </CardTitle>
                <CardDescription className="text-xs">
                  Ajuste quais tipos de alertas disparam notificações automáticas no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-[#131728]">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                      Notificar equipe ao criar novo chamado
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Dispara alerta para o técnico designado e administradores.
                    </p>
                  </div>
                  <Switch checked={notifTicketCreate} onCheckedChange={setNotifTicketCreate} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-[#131728]">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                      Notificar solicitante em mudanças de status
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Avisa o usuário final quando o chamado entra em andamento, agendado ou
                      fechado.
                    </p>
                  </div>
                  <Switch checked={notifTicketStatus} onCheckedChange={setNotifTicketStatus} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-[#131728]">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                      Lembretes automáticos de preventivas (48 horas antes)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      O cron job diário analisa a agenda e alerta o técnico responsável.
                    </p>
                  </div>
                  <Switch checked={notifPreventiva} onCheckedChange={setNotifPreventiva} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
export default Configuracoes
