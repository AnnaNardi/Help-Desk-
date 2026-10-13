import React, { useState, useEffect, useMemo } from 'react'
import { activityLogService } from '@/services/notifications'
import { ActivityLog } from '@/types/helpdesk'
import { Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ResponsivePagination, useResponsivePageSize } from '@/components/ResponsivePagination'

export const ActivityLogsPage: React.FC = () => {
  const pageSize = useResponsivePageSize()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true)
        const data = await activityLogService.getAll(150)
        setLogs(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadLogs()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search])

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.entity_type && l.entity_type.toLowerCase().includes(search.toLowerCase())) ||
      (l.expand?.user?.name && l.expand.user.name.toLowerCase().includes(search.toLowerCase())),
  )

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Registro de Atividades do Sistema
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Auditoria de logins, logouts, modificações de entidades, tickets e preventivas (Somente
          Leitura)
        </p>
      </div>

      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filtrar por ação, entidade ou usuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#131728] border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-3">Usuário</th>
                  <th className="py-3 px-3">Ação</th>
                  <th className="py-3 px-3">Entidade</th>
                  <th className="py-3 px-4">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Carregando logs de auditoria...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Nenhum registro de atividade encontrado.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.created).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {log.expand?.user?.name || 'Sistema / Convidado'}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant="outline"
                          className={
                            log.action === 'login'
                              ? 'border-green-500 text-green-600 font-mono'
                              : log.action === 'logout'
                                ? 'border-slate-400 text-slate-500 font-mono'
                                : 'border-blue-500 text-blue-600 font-mono'
                          }
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {log.entity_type
                          ? `${log.entity_type} (${log.entity_id?.slice(0, 8) || ''})`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-sm truncate text-[11px] font-mono">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3">
            <ResponsivePagination
              currentPage={page}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
              itemName="atividades"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export default ActivityLogsPage
