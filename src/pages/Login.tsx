import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
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
import { Checkbox } from '@/components/ui/checkbox'
import { ClipboardList, AlertCircle, Loader2 } from 'lucide-react'

export const Login: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const u = await login(email.trim(), password)
      if (!u.ativo) {
        setError('Sua conta está inativa ou aguardando aprovação pelo Administrador.')
        setLoading(false)
        return
      }
      navigate('/')
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setError(
        errorObj.message?.includes('Failed to authenticate')
          ? 'Credenciais inválidas. Verifique seu e-mail e senha.'
          : 'Erro ao autenticar. Tente novamente.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-[#0B0D19] dark:via-[#0F1222] dark:to-[#171B30] p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#1A1E30]/95 backdrop-blur">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-3 shadow-md shadow-blue-500/20">
            <ClipboardList className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sistema Help Desk
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Sistema Integrado de Gestão de Chamados e Suporte Técnico
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                E-mail de acesso
              </label>
              <Input
                type="email"
                placeholder="seu.email@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-sm bg-slate-50 dark:bg-[#131728] border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                  Senha
                </label>
                <Link
                  to="/esqueci-senha"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 text-sm bg-slate-50 dark:bg-[#131728] border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <label
                htmlFor="remember"
                className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Lembrar de mim neste dispositivo
              </label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Acessando...
                </>
              ) : (
                'Entrar no Sistema'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
export default Login
