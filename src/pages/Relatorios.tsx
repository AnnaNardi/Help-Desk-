import React, { useState, useEffect } from 'react'
import { ticketService } from '@/services/tickets'
import { companyService } from '@/services/companies'
import { userService } from '@/services/users'
import { preventivaService } from '@/services/preventivas'
import { Ticket, Company, User, Preventiva } from '@/types/helpdesk'
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  PieChart,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ResponsivePagination, useResponsivePageSize } from '@/components/ResponsivePagination'

export const Relatorios: React.FC = () => {
  const pageSize = useResponsivePageSize()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [preventivas, setPreventivas] = useState<Preventiva[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  // Report Type
  const [reportType, setReportType] = useState<string>('empresa')
  const [filterCompany, setFilterCompany] = useState('all')
  const [filterTech, setFilterTech] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true)
        const [allT, allC, allTechs, allP] = await Promise.all([
          ticketService.getAllTickets(),
          companyService.getAll(),
          userService.getTechnicians(),
          preventivaService.getAll(),
        ])
        setTickets(allT)
        setCompanies(allC)
        setTechnicians(allTechs)
        setPreventivas(allP)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [reportType, filterCompany, filterTech, filterPriority, filterStatus])

  // Filtered dataset
  const filteredTickets = tickets.filter((t) => {
    if (filterCompany !== 'all' && (filterCompany === 'none' ? !!t.company : t.company !== filterCompany)) return false
    if (filterTech !== 'all' && t.technician !== filterTech) return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    return true
  })

  const paginatedTickets = filteredTickets.slice((page - 1) * pageSize, page * pageSize)

  // Export to CSV
  const exportCSV = () => {
    const headers = [
      'Numero',
      'Titulo',
      'Empresa',
      'Solicitante',
      'Tecnico',
      'Prioridade',
      'Status',
      'Data_Abertura',
      'Data_Fechamento',
    ]
    const rows = filteredTickets.map((t) => [
      `"${t.numero}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.expand?.company?.nome_fantasia || ''}"`,
      `"${t.expand?.requester?.name || ''}"`,
      `"${t.expand?.technician?.name || ''}"`,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${t.opened_at.slice(0, 10)}"`,
      `"${t.closed_at ? t.closed_at.slice(0, 10) : ''}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `relatorio_chamados_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export to Printable PDF view
  const exportPDF = () => {
    window.print()
  }

  // Breakdown aggregations
  const getBreakdownData = () => {
    if (reportType === 'empresa') {
      return companies.map((c) => ({
        label: c.nome_fantasia,
        count: filteredTickets.filter((t) => t.company === c.id).length,
      }))
    } else if (reportType === 'tecnico') {
      return technicians.map((tech) => ({
        label: tech.name,
        count: filteredTickets.filter((t) => t.technician === tech.id).length,
      }))
    } else if (reportType === 'prioridade') {
      return ['Alta', 'Média', 'Baixa'].map((p) => ({
        label: p,
        count: filteredTickets.filter((t) => t.priority === p).length,
      }))
    } else {
      return ['Aberto', 'Em andamento', 'Agendado', 'Fechado'].map((s) => ({
        label: s,
        count: filteredTickets.filter((t) => t.status === s).length,
      }))
    }
  }

  const breakdown = getBreakdownData()
  const maxVal = Math.max(...breakdown.map((b) => b.count), 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Relatórios e Métricas de SLA
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Estatísticas operacionais, volumetria por técnico, empresa e prioridade
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="text-xs text-slate-700 dark:text-slate-300"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5 text-green-600" />
            Exportar CSV
          </Button>
          <Button
            size="sm"
            onClick={exportPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Exportar PDF / Imprimir
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">
                Tipo de Relatório
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empresa">Chamados por Empresa</SelectItem>
                  <SelectItem value="tecnico">Chamados por Técnico</SelectItem>
                  <SelectItem value="prioridade">Chamados por Prioridade</SelectItem>
                  <SelectItem value="status">Chamados por Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">
                Filtrar Empresa
              </label>
              <Select value={filterCompany} onValueChange={setFilterCompany}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="none">Pessoa Física / Sem empresa</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome_fantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">
                Filtrar Técnico
              </label>
              <Select value={filterTech} onValueChange={setFilterTech}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">
                Filtrar Prioridade
              </label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">
                Filtrar Status
              </label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Aberto">Aberto</SelectItem>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Agendado">Agendado</SelectItem>
                  <SelectItem value="Fechado">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Barras do Breakdown */}
      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            Distribuição Visual
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3">
            {breakdown.map((item, idx) => {
              const pct = Math.round((item.count / maxVal) * 100)
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                    <span className="font-mono text-slate-500 font-bold">
                      {item.count} chamados
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabela Detalhada com os Resultados */}
      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800 overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Registros Filtrados ({filteredTickets.length} resultados)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#131728] border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-2.5 px-4">Número</th>
                  <th className="py-2.5 px-3">Título</th>
                  <th className="py-2.5 px-3">Empresa</th>
                  <th className="py-2.5 px-3">Técnico</th>
                  <th className="py-2.5 px-3">Prioridade</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Abertura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-4 font-mono font-bold text-blue-600">{t.numero}</td>
                    <td className="py-2 px-3 font-medium max-w-xs truncate">{t.title}</td>
                    <td className="py-2 px-3">{t.expand?.company?.nome_fantasia || 'Pessoa física / sem empresa'}</td>
                    <td className="py-2 px-3">{t.expand?.technician?.name || '—'}</td>
                    <td className="py-2 px-3 font-semibold">{t.priority}</td>
                    <td className="py-2 px-3 font-semibold">{t.status}</td>
                    <td className="py-2 px-4 text-right text-slate-400">
                      {new Date(t.opened_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3">
            <ResponsivePagination
              currentPage={page}
              totalItems={filteredTickets.length}
              pageSize={pageSize}
              onPageChange={setPage}
              itemName="resultados"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export default Relatorios
