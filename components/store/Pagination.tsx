'use client'

import React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ChevronsLeft,
} from 'lucide-react'

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
    let start = leftSiblingIndex
    let end = rightSiblingIndex

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

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6">
      {/* Previous */}
      <div className="flex items-center gap-1">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          className="group hidden h-[37px] w-[37px] cursor-pointer items-center justify-center transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30 sm:flex"
          aria-label="First Page"
        >
          <ChevronsLeft
            aria-hidden="true"
            className="text-muted-foreground h-auto min-h-6 w-auto min-w-6 transition-colors group-hover:text-white"
          />
        </button>
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="group flex h-[37px] w-[37px] cursor-pointer items-center justify-center transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Previous Page"
        >
          <ChevronLeft
            aria-hidden="true"
            className="text-muted-foreground h-auto min-h-6 w-auto min-w-6 transition-colors group-hover:text-white"
          />
        </button>
      </div>

      {/* Page Numbers */}
      <div className="flex items-center gap-0.5 sm:gap-[8px]">
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <div className="flex h-[11px] w-[30px] items-center justify-center sm:w-[54px]">
                <span className="text-muted-foreground truncate text-center font-['Cooper_Hewitt'] text-[14px] leading-[18px] font-bold tracking-[0.2em]">
                  ...
                </span>
              </div>
            ) : (
              <button
                onClick={() => typeof page === 'number' && onPageChange(page)}
                aria-current={currentPage === page ? 'page' : undefined}
                className={`flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[6px] text-center font-['Cooper_Hewitt'] text-[14px] leading-[18px] font-bold transition-all sm:h-[37px] sm:w-[37px] ${currentPage === page
                    ? 'bg-background border-primary text-foreground border-2'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary border-none hover:text-white'
                  }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Next */}
      <div className="flex items-center gap-1">
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="group flex h-[32px] w-[32px] cursor-pointer items-center justify-center transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Next Page"
        >
          <ChevronRight
            aria-hidden="true"
            className="text-muted-foreground h-auto min-h-6 w-auto min-w-6 transition-colors group-hover:text-white"
          />
        </button>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          className="group hidden h-[32px] w-[32px] cursor-pointer items-center justify-center transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30 sm:flex"
          aria-label="Last Page"
        >
          <ChevronsRight
            aria-hidden="true"
            className="text-muted-foreground h-auto min-h-6 w-auto min-w-6 transition-colors group-hover:text-white"
          />
        </button>
      </div>
    </div>
  )
}

export default Pagination
