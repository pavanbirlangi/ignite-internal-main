'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Helper to generate page numbers
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | string)[] = []
    const siblingCount = 1
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

    const showLeftDots = leftSiblingIndex > 2
    const showRightDots = rightSiblingIndex < totalPages - 1

    // First page
    pages.push(1)

    if (showLeftDots) {
      pages.push('...')
    }

    // Middle range
    const start = leftSiblingIndex
    const end = rightSiblingIndex

    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i)
      }
    }

    // Right dots
    if (showRightDots) {
      pages.push('...')
    }

    // Last page
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1) return null

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={ARROW_CLASS}
        aria-label="Previous Page"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </button>

      {getPageNumbers().map((page, index) =>
        page === '...' ? (
          <span
            key={`dots-${index}`}
            aria-hidden="true"
            className="flex h-9 w-6 items-center justify-center text-sm font-medium text-white/45"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => typeof page === 'number' && onPageChange(page)}
            aria-current={currentPage === page ? 'page' : undefined}
            className={cn(
              'flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/40',
              currentPage === page
                ? 'text-background bg-white'
                : 'bg-secondary text-white/65 hover:bg-white/10 hover:text-white',
            )}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={ARROW_CLASS}
        aria-label="Next Page"
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
    </nav>
  )
}

const ARROW_CLASS =
  'flex size-9 cursor-pointer items-center justify-center rounded-lg text-white/65 transition-colors outline-none hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-30'

export default Pagination
