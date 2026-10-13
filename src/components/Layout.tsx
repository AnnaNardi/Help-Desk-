import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { notificationService } from '@/services/notifications'
import { ticketService } from '@/services/tickets'
import { Notification } from '@/types/helpdesk'
import pb from '@/lib/api/client'
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  Building2,
  CalendarCheck2,
  Users,
  Wrench,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
  Search,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  UserCheck,
  ShieldAlert,
  ClipboardList,
  BookOpen,
  Info,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, theme, setTheme } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [chamadosExpanded, setChamadosExpanded] = useState(true)
  const [quickSearch, setQuickSearch] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [bellShaking, setBellShaking] = useState(false)

  const role = user?.role || 'Usuario'
  const isAdmin = role === 'Admin'
  const isTecnico = role === 'Tecnico'

  // Load and listen to notifications
  useEffect(() => {
    if (!user) return

    const loadNotifs = async () => {
      try {
        const list = await notificationService.getUserNotifications(user.id)
        setNotifications(list.slice(0, 8))
        const count = list.filter((n) => !n.read).length
        setUnreadCount(count)
      } catch {
        /* intentionally ignored */
      }
    }
    loadNotifs()

    // Realtime subscription for notifications
    try {
      pb.collection('notifications').subscribe('*', (e) => {
        if (e.record.user === user.id) {
          loadNotifs()
          // Trigger shake animation
          setBellShaking(true)
          setTimeout(() => setBellShaking(false), 1000)
        }
      })
    } catch {
      /* intentionally ignored */
    }

    return () => {
      try {
        pb.collection('notifications').unsubscribe('*')
      } catch {
        /* intentionally ignored */
      }
    }
  }, [user])

  const handleQuickSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickSearch.trim()) return
    try {
      const found = await ticketService.findByNumero(quickSearch.trim())
      if (found) {
        navigate(`/chamados/${found.id}`)
        setQuickSearch('')
      } else {
        navigate(`/chamados?search=${encodeURIComponent(quickSearch.trim())}`)
        setQuickSearch('')
      }
    } catch {
      navigate(`/chamados?search=${encodeURIComponent(quickSearch.trim())}`)
      setQuickSearch('')
    }
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    await notificationService.markAllAsRead(user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const toggleTheme = () => {
    setTheme(theme === 'escuro' ? 'claro' : 'escuro')
  }

  const companyName = user?.expand?.company?.nome_fantasia || 'Empresa Principal'
  const isSemContrato = user?.expand?.company?.contrato_status === 'Sem contrato'

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7FB] dark:bg-[#0F1222] text-[#0F172A] dark:text-[#F1F5F9] font-sans antialiased">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E2E8F0] dark:border-[#2A2F45] bg-white/95 dark:bg-[#1A1E30]/95 backdrop-blur px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-600 dark:text-slate-300"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-blue-600 dark:text-blue-400">
                Sistema Help Desk
              </span>
              <span className="font-semibold text-base tracking-tight ml-1 text-slate-800 dark:text-slate-200">
              </span>
            </div>
          </Link>
        </div>

        {/* Quick search (Admin and Technicians) */}
        <div className="flex-1 max-w-md mx-6 hidden md:block">
          {(isAdmin || isTecnico) && (
            <form onSubmit={handleQuickSearch} className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Busca rápida por nº do chamado (#1001) ou título..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-slate-50 dark:bg-[#131728] border-slate-200 dark:border-slate-800 focus:ring-blue-500"
              />
            </form>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'escuro' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {theme === 'escuro' ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`relative text-slate-600 dark:text-slate-300 ${
                  bellShaking ? 'animate-bounce text-blue-600' : ''
                }`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 p-2 shadow-xl border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-sm">Notificações</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto py-1 divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Nenhuma notificação no momento.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => {
                        notificationService.markAsRead(n.id)
                        if (n.ticket) navigate(`/chamados/${n.ticket}`)
                        else if (n.preventiva) navigate(`/preventivas`)
                        else navigate(`/notificacoes`)
                      }}
                      className={`flex flex-col items-start gap-1 p-2.5 cursor-pointer rounded-md ${
                        !n.read ? 'bg-blue-50/70 dark:bg-blue-950/30' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {n.title}
                        </span>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.created).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="justify-center text-xs font-medium text-blue-600 dark:text-blue-400 cursor-pointer py-2"
                onClick={() => navigate('/notificacoes')}
              >
                Ver todas as notificações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Mini */}
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold leading-tight line-clamp-1">{user?.name}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                {user?.role}
              </span>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm border border-blue-200 dark:border-blue-700">
              {user?.name?.slice(0, 2).toUpperCase() || 'US'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1">
        {/* Desktop Sidebar (Fixed 260px) */}
        <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-[#E2E8F0] dark:border-[#2A2F45] bg-white dark:bg-[#1A1E30] p-4">
          <nav className="space-y-1">
            <Link
              to="/"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>

            {/* Chamados with sub-items */}
            <div>
              <div
                onClick={() => setChamadosExpanded(!chamadosExpanded)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  location.pathname.startsWith('/chamados')
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TicketIcon className="h-4 w-4" />
                  <span>{role === 'Usuario' ? 'Meus Chamados' : 'Chamados'}</span>
                </div>
                {chamadosExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
              </div>

              {chamadosExpanded && (
                <div className="ml-6 mt-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 pl-3">
                  <Link
                    to="/chamados"
                    className={`block py-1.5 text-xs transition-colors ${
                      location.pathname === '/chamados' && !location.search
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Todos
                  </Link>
                  <Link
                    to="/chamados?status=Aberto"
                    className={`block py-1.5 text-xs transition-colors ${
                      location.search.includes('status=Aberto')
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Abertos
                  </Link>
                  <Link
                    to="/chamados?status=Em%20andamento"
                    className={`block py-1.5 text-xs transition-colors ${
                      location.search.includes('status=Em%20andamento')
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Em Andamento
                  </Link>
                  <Link
                    to="/chamados?status=Agendado"
                    className={`block py-1.5 text-xs transition-colors ${
                      location.search.includes('status=Agendado')
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Agendados
                  </Link>
                  <Link
                    to="/chamados?status=Fechado"
                    className={`block py-1.5 text-xs transition-colors ${
                      location.search.includes('status=Fechado')
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Fechados
                  </Link>
                </div>
              )}
            </div>

            {/* Preventivas */}
            <Link
              to="/preventivas"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.startsWith('/preventivas')
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CalendarCheck2 className="h-4 w-4" />
              Preventivas
            </Link>

            {/* Admin only items */}
            {isAdmin && (
              <>
                <Link
                  to="/empresas"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/empresas')
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  Empresas
                </Link>

                <Link
                  to="/usuarios"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/usuarios')
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Usuários
                </Link>

                <Link
                  to="/tecnicos"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/tecnicos')
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Wrench className="h-4 w-4" />
                  Técnicos
                </Link>

                <Link
                  to="/relatorios"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/relatorios')
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Relatórios
                </Link>
              </>
            )}

            {/* Notificações link */}
            <Link
              to="/notificacoes"
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.startsWith('/notificacoes')
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4" />
                <span>Notificações</span>
              </div>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </Link>

            {/* Configurações */}
            <Link
              to="/configuracoes"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.startsWith('/configuracoes')
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="h-4 w-4" />
              Configurações
            </Link>

            {/* Activity Logs (Admin) */}
            {isAdmin && (
              <Link
                to="/logs"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/logs')
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
                Logs de Atividades
              </Link>
            )}

            {/* Seção Ajuda & Documentação */}
            <div className="pt-2">
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Ajuda
              </div>
              <Link
                to="/manual"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/manual')
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Manual de Uso
              </Link>

              <Link
                to="/sobre"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/sobre')
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Info className="h-4 w-4" />
                Sobre o Sistema
              </Link>
            </div>
          </nav>

          {/* User profile & Company badge in footer */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-6">
            <div className="mb-3 px-2">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.name}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {isSemContrato ? (
                  <span className="inline-block text-[10px] font-medium text-sky-500 border border-dashed border-sky-400 rounded px-1.5 py-0.5">
                    Cliente sem contrato
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {companyName}
                  </span>
                )}
              </div>
              <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {user?.role}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="w-full justify-start text-xs text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Sair do Sistema
            </Button>
          </div>
        </aside>

        {/* Mobile Slide-in Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-72 flex-col justify-between bg-white dark:bg-[#1A1E30] p-4 shadow-2xl">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                      <ClipboardList className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-sm">Sistema Help Desk</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <nav className="mt-4 space-y-1.5">
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    to="/chamados"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <TicketIcon className="h-4 w-4" />
                    Chamados
                  </Link>
                  <Link
                    to="/preventivas"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <CalendarCheck2 className="h-4 w-4" />
                    Preventivas
                  </Link>
                  {isAdmin && (
                    <>
                      <Link
                        to="/empresas"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Building2 className="h-4 w-4" />
                        Empresas
                      </Link>
                      <Link
                        to="/usuarios"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Users className="h-4 w-4" />
                        Usuários
                      </Link>
                      <Link
                        to="/tecnicos"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Wrench className="h-4 w-4" />
                        Técnicos
                      </Link>
                      <Link
                        to="/relatorios"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Relatórios
                      </Link>
                      <Link
                        to="/logs"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        Logs de Atividades
                      </Link>
                    </>
                  )}
                  <Link
                    to="/notificacoes"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Bell className="h-4 w-4" />
                    Notificações
                  </Link>
                  <Link
                    to="/configuracoes"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Settings className="h-4 w-4" />
                    Configurações
                  </Link>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <Link
                      to="/manual"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <BookOpen className="h-4 w-4" />
                      Manual de Uso
                    </Link>
                    <Link
                      to="/sobre"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Info className="h-4 w-4" />
                      Sobre o Sistema
                    </Link>
                  </div>
                </nav>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <Button variant="outline" onClick={logout} className="w-full text-xs text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair do Sistema
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden mb-16 md:mb-0">{children}</main>
      </div>

      {/* Bottom Nav for Mobile (<768px) */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex md:hidden h-14 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#1A1E30]/95 backdrop-blur items-center justify-around px-2">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] ${
            location.pathname === '/'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Início</span>
        </Link>
        <Link
          to="/chamados"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] ${
            location.pathname.startsWith('/chamados')
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <TicketIcon className="h-4 w-4" />
          <span>Chamados</span>
        </Link>
        <Link
          to="/preventivas"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] ${
            location.pathname.startsWith('/preventivas')
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <CalendarCheck2 className="h-4 w-4" />
          <span>Preventivas</span>
        </Link>
        <Link
          to="/configuracoes"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] ${
            location.pathname.startsWith('/configuracoes')
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Perfil</span>
        </Link>
      </nav>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] dark:border-[#2A2F45] bg-white dark:bg-[#1A1E30] py-3 px-6 text-center text-xs text-slate-500 dark:text-slate-400 hidden md:block">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-2">
          <div className="flex items-center gap-3">
            <span>Sistema Help Desk — Versão 2.4.0</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <Link
              to="/manual"
              className="hover:text-blue-600 dark:hover:text-blue-400 underline-offset-2 hover:underline"
            >
              Manual de Uso
            </Link>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <Link
              to="/sobre"
              className="hover:text-blue-600 dark:hover:text-blue-400 underline-offset-2 hover:underline"
            >
              Sobre
            </Link>
          </div>
          <span>Aplicação de gestão de chamados © 2026.</span>
        </div>
      </footer>
    </div>
  )
}
export default Layout
