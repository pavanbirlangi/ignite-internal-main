'use client'

import { Search, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'

const sortOptions = [
  { label: 'Order Date', sort: 'purchased_at', order: 'desc' },
  { label: 'Name (A-Z)', sort: 'title', order: 'asc' },
  { label: 'Name (Z-A)', sort: 'title', order: 'desc' },
]

interface LibraryHeaderProps {
  search: string
  onSearchChange: (value: string) => void
  sort: string
  order: string
  onSortChange: (sort: string, order: string) => void
}

export function LibraryHeader({
  search,
  onSearchChange,
  sort,
  order,
  onSortChange,
}: LibraryHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localSearch, setLocalSearch] = useState(search)

  // Use the debounce hook to debounce search input
  const debouncedSearch = useDebounce(localSearch, 500)

  // Trigger search change when debounced value changes
  useEffect(() => {
    onSearchChange(debouncedSearch)
  }, [debouncedSearch, onSearchChange])

  // Sync if external search changes (e.g. reset)
  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  // Find active label securely
  const activeOption =
    sortOptions.find((opt) => opt.sort === sort && opt.order === order) ||
    sortOptions[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-semibold md:text-[40px]">My Library</h1>

        {/* Mobile Dropdown Trigger */}
        <div className="relative md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex h-[50px] cursor-pointer items-center gap-2 rounded-[6px] px-5 text-sm font-normal transition-colors"
          >
            <span>{activeOption.label}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 opacity-60 transition-transform',
                isOpen && 'rotate-180',
              )}
            />
          </button>

          {isOpen && (
            <>
              {/* Overlay to close on mobile */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="border-border bg-card absolute top-full right-0 z-20 mt-2 w-[180px] flex-col overflow-hidden rounded-[12px] border shadow-xl">
                {sortOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => {
                      onSortChange(option.sort, option.order)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'hover:bg-secondary/50 flex h-[40px] w-full items-center px-5 text-sm font-medium transition-colors',
                      activeOption.label === option.label
                        ? 'bg-primary/10 text-primary'
                        : 'text-card-foreground',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-[522px]">
          <Search className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search products..."
            className="border-muted-foreground/40 text-foreground placeholder:text-muted-foreground focus:border-primary h-12.5 w-full rounded-full border bg-transparent pr-4 pl-10 text-sm transition-colors outline-none"
          />
        </div>

        {/* Desktop Dropdown */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex h-[50px] cursor-pointer items-center gap-1 rounded-[6px] px-4 py-3.5 font-semibold transition-colors"
          >
            <span>{activeOption.label}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 opacity-60 transition-transform',
                isOpen && 'rotate-180',
              )}
            />
          </button>

          {isOpen && (
            <>
              {/* Overlay to close on desktop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="border-border bg-card absolute top-full right-0 z-20 mt-2 w-[180px] flex-col overflow-hidden rounded-[12px] border shadow-xl">
                {sortOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => {
                      onSortChange(option.sort, option.order)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'hover:bg-secondary/50 flex h-[40px] w-full items-center px-5 text-sm font-medium transition-colors',
                      activeOption.label === option.label
                        ? 'bg-primary/10 text-primary'
                        : 'text-card-foreground',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
