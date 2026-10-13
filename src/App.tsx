import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import Login from '@/pages/Login'
import { ForgotPassword, ResetPassword, VerifyEmail, ConfirmEmailChange } from '@/pages/AuthPages'
import TicketsList from '@/pages/TicketsList'
import TicketCreate from '@/pages/TicketCreate'
import TicketDetail from '@/pages/TicketDetail'
import Preventivas from '@/pages/Preventivas'
import Empresas from '@/pages/Empresas'
import Usuarios from '@/pages/Usuarios'
import Tecnicos from '@/pages/Tecnicos'
import Notificacoes from '@/pages/Notificacoes'
import Relatorios from '@/pages/Relatorios'
import Configuracoes from '@/pages/Configuracoes'
import ActivityLogsPage from '@/pages/ActivityLogsPage'
import Manual from '@/pages/Manual'
import Sobre from '@/pages/Sobre'
import NotFound from '@/pages/NotFound'
import { Loader2 } from 'lucide-react'

// Protected Route Wrapper
const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F7FB] dark:bg-[#0F1222]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-xs text-slate-500 font-medium">
            Carregando Sistema Help Desk...
          </span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

// Admin only route guard
const AdminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  if (user?.role !== 'Admin') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/esqueci-senha" element={<ForgotPassword />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            <Route path="/verificar-email" element={<VerifyEmail />} />
            <Route path="/confirmar-email" element={<ConfirmEmailChange />} />

            {/* Authenticated Application Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/chamados" element={<TicketsList />} />
              <Route path="/chamados/novo" element={<TicketCreate />} />
              <Route path="/chamados/:id" element={<TicketDetail />} />
              <Route path="/preventivas" element={<Preventivas />} />
              <Route path="/notificacoes" element={<Notificacoes />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/manual" element={<Manual />} />
              <Route path="/sobre" element={<Sobre />} />

              {/* Admin & TI Staff Routes */}
              <Route
                path="/empresas"
                element={
                  <AdminOnly>
                    <Empresas />
                  </AdminOnly>
                }
              />
              <Route
                path="/empresas/:id"
                element={
                  <AdminOnly>
                    <Empresas />
                  </AdminOnly>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <AdminOnly>
                    <Usuarios />
                  </AdminOnly>
                }
              />
              <Route
                path="/tecnicos"
                element={
                  <AdminOnly>
                    <Tecnicos />
                  </AdminOnly>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <AdminOnly>
                    <Relatorios />
                  </AdminOnly>
                }
              />
              <Route
                path="/logs"
                element={
                  <AdminOnly>
                    <ActivityLogsPage />
                  </AdminOnly>
                }
              />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
