'use client'

import { Search, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { SortOrder } from '@/store/useOrderStore'
import {
  ACCOUNT_MENU_PANEL_CLASS,
  ACCOUNT_SEARCH_INPUT_CLASS,
  ACCOUNT_SORT_TRIGGER_CLASS,
  AccountPageHeader,
  accountMenuItemClass,
} from '@/components/library/account-ui'

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
    <div>
      <AccountPageHeader title="My Orders" />

      <div className="flex gap-3">
        {/* Search */}
        <div className="relative min-w-0 flex-1 sm:max-w-[520px]">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/45" />
          <input
            type="text"
            placeholder="Search by Order Number or Product Title"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className={cn(ACCOUNT_SEARCH_INPUT_CLASS, 'text-ellipsis')}
          />
        </div>

        {/* Sort */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            className={ACCOUNT_SORT_TRIGGER_CLASS}
          >
            <span>{activeLabel}</span>
            <ChevronDown
              className={cn(
                'size-4 text-white/65 transition-transform',
                isOpen && 'rotate-180',
              )}
            />
          </button>

          {isOpen && (
            <>
              {/* Clicking anywhere outside closes the menu */}
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              <div className={ACCOUNT_MENU_PANEL_CLASS}>
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onSortChange(option.value)
                      setIsOpen(false)
                    }}
                    className={accountMenuItemClass(sortOrder === option.value)}
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
