import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { userService } from '@/services/users'
import pb from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import {
  ClipboardList,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LifeBuoy,
} from 'lucide-react'

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [feedback, setFeedback] = useState<{
    alreadyOpen?: boolean
    ticketNumero?: string
    message: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await userService.requestPasswordResetTicket(email.trim())
      setFeedback({
        alreadyOpen: res.alreadyOpen,
        ticketNumero: res.ticketNumero,
        message:
          res.message ||
          'Sua solicitação de redefinição de senha foi registrada com sucesso para a equipe de T.I.',
      })
      setSent(true)
    } catch {
      // Mensagem genérica amigável
      setFeedback({
        alreadyOpen: false,
        message:
          'Se o e-mail informado estiver cadastrado e ativo em nosso sistema, o chamado foi registrado para a equipe de T.I.',
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-[#0B0D19] dark:via-[#0F1222] dark:to-[#171B30] p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#1A1E30]/95 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-3 shadow-md shadow-blue-500/20">
            <ClipboardList className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-bold">Sistema Help Desk</CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Informe seu e-mail para abrir um chamado de redefinição de senha diretamente com a
            equipe de T.I.
          </CardDescription>
        </CardHeader>

        {sent ? (
          <CardContent className="space-y-4 text-center py-4">
            <div className="flex justify-center text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-12 w-12" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {feedback?.alreadyOpen
                  ? 'Solicitação Já em Andamento'
                  : 'Solicitação Registrada com Sucesso!'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {feedback?.message}
              </p>
              {feedback?.ticketNumero && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold border border-blue-200 dark:border-blue-800">
                  <LifeBuoy className="h-3.5 w-3.5" />
                  Protocolo: {feedback.ticketNumero}
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#131728] p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-left">
              <strong>Como funciona:</strong> Nosso suporte técnico receberá sua solicitação, gerará
              sua nova credencial de acesso e entrará em contato com você ou seus dados cadastrados.
            </p>

            <Button asChild className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
              <Link to="/login">Voltar ao Login</Link>
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-red-50 text-red-600 border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                  E-mail cadastrado
                </label>
                <Input
                  type="email"
                  placeholder="seu.email@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 text-sm bg-slate-50 dark:bg-[#131728] border-slate-200 dark:border-slate-800"
                />
                <p className="text-[11px] text-slate-500">
                  Ao confirmar, um chamado técnico de redefinição de senha será aberto para o seu
                  usuário.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Abrir Chamado para Redefinição
              </Button>
              <Button asChild variant="ghost" className="w-full text-xs">
                <Link to="/login">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Voltar ao login
                </Link>
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('As senhas não conferem.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await pb.collection('users').confirmPasswordReset(token, password, confirm)
      setSuccess(true)
    } catch {
      setError('Token inválido ou expirado. Solicite uma nova recuperação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-[#0B0D19] dark:via-[#0F1222] dark:to-[#171B30] p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#1A1E30]/95 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">Criar Nova Senha</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Digite sua nova senha de acesso.
          </CardDescription>
        </CardHeader>
        {success ? (
          <CardContent className="space-y-4 text-center py-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <p className="text-sm">Sua senha foi redefinida com sucesso!</p>
            <Button asChild className="w-full">
              <Link to="/login">Ir para o Login</Link>
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-xs bg-red-50 text-red-600 rounded border border-red-200">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Nova senha (mínimo 8 caracteres)</label>
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Confirme a nova senha</label>
                <Input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar Nova Senha
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}

export const VerifyEmail: React.FC = () => {
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'ok' | 'err'>('ok')

  React.useEffect(() => {
    if (!token) {
      setLoading(false)
      setStatus('err')
      return
    }
    pb.collection('users')
      .confirmVerification(token)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('err'))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center p-6">
        {loading ? (
          <p className="text-sm">Verificando seu e-mail...</p>
        ) : status === 'ok' ? (
          <div>
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <h2 className="text-lg font-bold">E-mail verificado com sucesso!</h2>
            <Button asChild className="mt-4">
              <Link to="/login">Acessar Sistema</Link>
            </Button>
          </div>
        ) : (
          <div>
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
            <h2 className="text-lg font-bold">Link inválido ou expirado.</h2>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/login">Voltar ao Login</Link>
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export const ConfirmEmailChange: React.FC = () => {
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'ok' | 'err'>('ok')

  React.useEffect(() => {
    if (!token) {
      setLoading(false)
      setStatus('err')
      return
    }
    pb.collection('users')
      .confirmEmailChange(token)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('err'))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center p-6">
        {loading ? (
          <p className="text-sm">Confirmando alteração de e-mail...</p>
        ) : status === 'ok' ? (
          <div>
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <h2 className="text-lg font-bold">E-mail alterado com sucesso!</h2>
            <p className="text-xs text-slate-500 mt-2">
              Por gentileza, faça login novamente com o seu novo endereço de e-mail.
            </p>
            <Button asChild className="mt-4">
              <Link to="/login">Fazer Login</Link>
            </Button>
          </div>
        ) : (
          <div>
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
            <h2 className="text-lg font-bold">Erro ao confirmar alteração de e-mail.</h2>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/login">Voltar ao Login</Link>
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
