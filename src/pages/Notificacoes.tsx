import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { notificationService } from '@/services/notifications'
import { Notification } from '@/types/helpdesk'
import pb from '@/lib/api/client'
import {
  Bell,
  CheckCircle,
  Ticket as TicketIcon,
  CalendarCheck2,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ResponsivePagination, useResponsivePageSize } from '@/components/ResponsivePagination'

export const Notificacoes: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const pageSize = useResponsivePageSize()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const loadNotifs = async () => {
    if (!user) return
    try {
      setLoading(true)
      const list = await notificationService.getUserNotifications(user.id)
      setNotifications(list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifs()

    const unsub = pb.collection('notifications').subscribe('*', (e) => {
      if (e.record.user === user?.id) {
        loadNotifs()
      }
    })

    return () => {
      pb.collection('notifications').unsubscribe('*')
    }
  }, [user])

  const handleMarkRead = async (id: string) => {
    await notificationService.markAsRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    await notificationService.markAllAsRead(user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Central de Notificações
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Avisos de novos chamados, atualizações de status, agendamentos e preventivas
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="text-xs">
            <CheckCircle className="h-4 w-4 mr-1.5 text-blue-600" />
            Marcar todas como lidas ({unreadCount})
          </Button>
        )}
      </div>

      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-500">
              Carregando notificações...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Bell className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold">Tudo limpo por aqui!</p>
              <p className="text-xs text-slate-500">Você não possui notificações pendentes.</p>
            </div>
          ) : (
            <div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.slice((page - 1) * pageSize, page * pageSize).map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                      !n.read
                        ? 'bg-blue-50/50 dark:bg-blue-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          n.type?.includes('preventiva')
                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-950'
                            : 'bg-blue-100 text-blue-600 dark:bg-blue-950'
                        }`}
                      >
                        {n.type?.includes('preventiva') ? (
                          <CalendarCheck2 className="h-4 w-4" />
                        ) : (
                          <TicketIcon className="h-4 w-4" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {n.title}
                          </span>
                          {!n.read && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {new Date(n.created).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {n.ticket && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleMarkRead(n.id)
                            navigate(`/chamados/${n.ticket}`)
                          }}
                          className="h-8 text-xs text-blue-600"
                        >
                          Ver Chamado <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                      {n.preventiva && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleMarkRead(n.id)
                            navigate(`/preventivas`)
                          }}
                          className="h-8 text-xs text-amber-600"
                        >
                          Ver Preventiva <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3">
                <ResponsivePagination
                  currentPage={page}
                  totalItems={notifications.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  itemName="notificações"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
export default Notificacoes
