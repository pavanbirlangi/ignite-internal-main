'use client'

import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ACCOUNT_MENU_PANEL_CLASS,
  ACCOUNT_SORT_TRIGGER_CLASS,
  accountMenuItemClass,
} from '@/components/library/account-ui'
import type { ProductReview } from '@/types/review'

export type ReviewSort = 'recent' | 'oldest' | 'highest' | 'lowest'

export const REVIEW_SORTS: ReviewSort[] = ['recent', 'oldest', 'highest', 'lowest']

const time = (review: ProductReview) => (review.createdAt ? new Date(review.createdAt).getTime() : 0)

// Ties on rating fall back to newest first.
export function sortReviews(reviews: ProductReview[], sort: ReviewSort): ProductReview[] {
  const byRecent = (a: ProductReview, b: ProductReview) => time(b) - time(a)
  const compare: Record<ReviewSort, (a: ProductReview, b: ProductReview) => number> = {
    recent: byRecent,
    oldest: (a, b) => time(a) - time(b),
    highest: (a, b) => b.rating - a.rating || byRecent(a, b),
    lowest: (a, b) => a.rating - b.rating || byRecent(a, b),
  }
  return [...reviews].sort(compare[sort])
}

export function ReviewSortMenu({
  value,
  onChange,
  label,
  optionLabels,
}: {
  value: ReviewSort
  onChange: (value: ReviewSort) => void
  label: string
  optionLabels: Record<ReviewSort, string>
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(ACCOUNT_SORT_TRIGGER_CLASS, 'h-10 rounded-[10px] px-3.5')}
      >
        <span className="font-normal text-white/65">{label}:</span>
        <span>{optionLabels[value]}</span>
        <ChevronDown className={cn('size-4 text-white/65 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          {/* Clicking anywhere outside closes the menu */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div role="menu" className={cn(ACCOUNT_MENU_PANEL_CLASS, 'right-auto left-0 w-52')}>
            {REVIEW_SORTS.map((option) => (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={value === option}
                onClick={() => {
                  onChange(option)
                  setIsOpen(false)
                }}
                className={cn(accountMenuItemClass(value === option), 'justify-between gap-3')}
              >
                <span>{optionLabels[option]}</span>
                {value === option && <Check className="size-4 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
