import React, { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { useIsMobile } from '@/hooks/use-mobile'

export interface ResponsivePaginationProps {
  currentPage: number
  totalItems: number
  pageSize?: number // opcional, caso queira forçar. Se omitido, usa 5 no celular e 10 no desktop.
  onPageChange: (page: number) => void
  itemName?: string // ex: "chamados", "empresas", "registros"
  className?: string
}

export const useResponsivePageSize = (): number => {
  const isMobile = useIsMobile()
  return isMobile ? 5 : 10
}

export const ResponsivePagination: React.FC<ResponsivePaginationProps> = ({
  currentPage,
  totalItems,
  pageSize: customPageSize,
  onPageChange,
  itemName = 'itens',
  className = '',
}) => {
  const isMobile = useIsMobile()
  const effectivePageSize = customPageSize || (isMobile ? 5 : 10)
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize))

  // Garante que o currentPage seja válido
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  const pages = useMemo(() => {
    if (totalPages <= 1) return []

    // No mobile, mostrar uma janela mais curta de páginas numeradas
    const maxButtons = isMobile ? 3 : 5
    const pageNumbers: (number | 'ellipsis')[] = []

    if (totalPages <= maxButtons + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      let start = Math.max(2, validCurrentPage - Math.floor((maxButtons - 2) / 2))
      let end = start + maxButtons - 3

      if (end >= totalPages) {
        end = totalPages - 1
        start = Math.max(2, end - (maxButtons - 3))
      }

      pageNumbers.push(1)

      if (start > 2) {
        pageNumbers.push('ellipsis')
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i)
      }

      if (end < totalPages - 1) {
        pageNumbers.push('ellipsis')
      }

      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }, [totalPages, validCurrentPage, isMobile])

  if (totalItems <= effectivePageSize && totalPages <= 1) {
    return null
  }

  const startItem = totalItems === 0 ? 0 : (validCurrentPage - 1) * effectivePageSize + 1
  const endItem = Math.min(validCurrentPage * effectivePageSize, totalItems)

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 border-t border-slate-100 dark:border-slate-800 ${className}`}
    >
      <div className="text-xs text-slate-500 dark:text-slate-400 order-2 sm:order-1">
        Exibindo{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {startItem}-{endItem}
        </span>{' '}
        de <span className="font-semibold text-slate-700 dark:text-slate-200">{totalItems}</span>{' '}
        {itemName}{' '}
        <span className="text-[11px] text-slate-400">({effectivePageSize} por página)</span>
      </div>

      <div className="order-1 sm:order-2">
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent className="gap-1">
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, validCurrentPage - 1))}
                disabled={validCurrentPage <= 1}
                className="h-8 px-2 text-xs"
              >
                <PaginationPrevious className="static p-0 hover:bg-transparent" />
              </Button>
            </PaginationItem>

            {pages.map((p, idx) => {
              if (p === 'ellipsis') {
                return (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }
              const isActive = p === validCurrentPage
              return (
                <PaginationItem key={p}>
                  <Button
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(p)}
                    className={`h-8 w-8 p-0 text-xs ${
                      isActive
                        ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {p}
                  </Button>
                </PaginationItem>
              )
            })}

            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, validCurrentPage + 1))}
                disabled={validCurrentPage >= totalPages}
                className="h-8 px-2 text-xs"
              >
                <PaginationNext className="static p-0 hover:bg-transparent" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
