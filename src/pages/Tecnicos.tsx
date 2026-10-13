import React, { useState, useEffect, useMemo } from 'react'
import { userService } from '@/services/users'
import { ticketService } from '@/services/tickets'
import { preventivaService } from '@/services/preventivas'
import { companyService } from '@/services/companies'
import { User, Ticket, Preventiva, Company } from '@/types/helpdesk'
import { Wrench, Phone, Mail } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ResponsivePagination, useResponsivePageSize } from '@/components/ResponsivePagination'

export const Tecnicos: React.FC = () => {
  const pageSize = useResponsivePageSize()
  const [technicians, setTechnicians] = useState<User[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [preventivas, setPreventivas] = useState<Preventiva[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  // Selected technician for drawer/modal detail
  const [selectedTech, setSelectedTech] = useState<User | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [techs, allT, allP, allC] = await Promise.all([
        userService.getTechnicians(),
        ticketService.getAllTickets(),
        preventivaService.getAll(),
        companyService.getAll(),
      ])
      setTechnicians(techs)
      setTickets(allT)
      setPreventivas(allP)
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

  const openTechDetails = (tech: User) => {
    setSelectedTech(tech)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Corpo Técnico
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Equipe de analistas, suporte N1/N2, especialistas em infraestrutura e redes
        </p>
      </div>

      {(() => {
        const paginatedTechs = technicians.slice((page - 1) * pageSize, page * pageSize)
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedTechs.map((tech) => {
                const techTickets = tickets.filter((t) => t.technician === tech.id)
                const abertos = techTickets.filter((t) => t.status === 'Aberto').length
                const andamento = techTickets.filter((t) => t.status === 'Em andamento').length
                const fechados = techTickets.filter((t) => t.status === 'Fechado').length

                return (
                  <Card
                    key={tech.id}
                    className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-base shrink-0">
                          {tech.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                            {tech.name}
                          </h3>
                          <Badge variant="outline" className="text-[10px] mt-0.5">
                            {tech.role}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{tech.email}</span>
                        </div>
                        {tech.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{tech.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* KPI Metrics do Técnico */}
                      <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#131728] text-center text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            Abertos
                          </span>
                          <p className="font-bold text-blue-600 text-sm mt-0.5">{abertos}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            Em Curso
                          </span>
                          <p className="font-bold text-amber-500 text-sm mt-0.5">{andamento}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            Resolvidos
                          </span>
                          <p className="font-bold text-green-600 text-sm mt-0.5">{fechados}</p>
                        </div>
                      </div>

                      <Button
                        onClick={() => openTechDetails(tech)}
                        className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700"
                      >
                        Ver Ficha e Demandas
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <ResponsivePagination
              currentPage={page}
              totalItems={technicians.length}
              pageSize={pageSize}
              onPageChange={setPage}
              itemName="técnicos"
            />
          </>
        )
      })()}

      {/* Modal Detalhes do Técnico */}
      {selectedTech && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                Desempenho Técnico: {selectedTech.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-3 bg-slate-50 dark:bg-[#131728] rounded-lg text-xs space-y-1">
                <p>
                  <strong>E-mail:</strong> {selectedTech.email}
                </p>
                <p>
                  <strong>Telefone:</strong> {selectedTech.phone || 'Não informado'}
                </p>
                <p>
                  <strong>Status de Acesso:</strong>{' '}
                  {selectedTech.ativo !== false ? 'Ativo' : 'Inativo'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Chamados Atribuídos (
                  {tickets.filter((t) => t.technician === selectedTech.id).length})
                </h4>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {tickets
                    .filter((t) => t.technician === selectedTech.id)
                    .map((t) => (
                      <div key={t.id} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-blue-600 mr-2">{t.numero}</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {t.title}
                          </span>
                        </div>
                        <Badge variant="outline">{t.status}</Badge>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Preventivas Atribuídas (
                  {preventivas.filter((p) => p.technician === selectedTech.id).length})
                </h4>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {preventivas
                    .filter((p) => p.technician === selectedTech.id)
                    .map((p) => (
                      <div key={p.id} className="py-2 flex items-center justify-between">
                        <span>{p.description}</span>
                        <Badge variant="outline">{p.status}</Badge>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
export default Tecnicos
