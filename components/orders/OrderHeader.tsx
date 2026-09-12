'use client'

import { Search, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { SortOrder } from '@/store/useOrderStore'

const sortOptions: { label: string; value: SortOrder }[] = [
  { label: 'Latest First', value: 'desc' },
  { label: 'Oldest First', value: 'asc' },
]

interface OrderHeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  sortOrder: SortOrder
  onSortChange: (value: SortOrder) => void
}

export function OrderHeader({
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange,
}: OrderHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const activeLabel =
    sortOptions.find((opt) => opt.value === sortOrder)?.label ?? 'Latest First'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] leading-tight font-semibold md:text-[40px]">
          My Orders
        </h1>

        {/* Mobile Dropdown Trigger */}
        <div className="relative shrink-0 md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex h-[50px] cursor-pointer items-center gap-2 rounded-[6px] px-5 text-sm font-normal transition-colors"
          >
            <span>{activeLabel}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 opacity-60 transition-transform',
                isOpen && 'rotate-180',
              )}
            />
          </button>

          {isOpen && (
            <div className="border-border bg-card absolute top-full right-0 z-20 mt-2 w-[180px] flex-col overflow-hidden rounded-[12px] border shadow-xl">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'hover:bg-secondary/50 flex h-[40px] w-full items-center px-5 py-3 font-medium transition-colors',
                    sortOrder === option.value
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-card-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-[522px]">
          <Search className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order Number or Product Title"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="border-muted-foreground/40 text-foreground placeholder:text-muted-foreground focus:border-primary h-[50px] w-full rounded-full border bg-transparent pr-4 pl-10 text-sm transition-colors outline-none"
          />
        </div>

        {/* Desktop Dropdown */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex h-[50px] cursor-pointer items-center gap-2 rounded-[6px] px-4 py-3.5 font-semibold transition-colors"
          >
            <span>{activeLabel}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 opacity-60 transition-transform',
                isOpen && 'rotate-180',
              )}
            />
          </button>

          {isOpen && (
            <div className="border-border bg-card absolute top-full right-0 z-20 mt-2 w-[180px] flex-col overflow-hidden rounded-[12px] border shadow-xl">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'hover:bg-secondary/50 flex h-[40px] w-full items-center px-5 text-sm font-medium transition-colors',
                    sortOrder === option.value
                      ? 'bg-primary/10 text-primary'
                      : 'text-card-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
