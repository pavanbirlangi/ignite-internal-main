'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACCOUNT_CARD_CLASS, ACCOUNT_SEARCH_INPUT_CLASS } from '@/components/library/account-ui'
import { TicketOrderLine } from '@/components/help/ticket/ticket-ui'
import type { SelectOrderProps } from '@/types/HelpTypes'

// Step 1 of an order ticket: the customer's orders (cover, status, total, as in My Orders),
// searchable by product or order number. Questions without an order go to the general form.
export function SelectOrder({ orders, onSelectOrder, isLoading, noOrderHref }: SelectOrderProps) {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const shown = useMemo(
    () => (needle ? orders.filter((o) => o.id.includes(needle) || o.products.toLowerCase().includes(needle)) : orders),
    [needle, orders],
  )

  return (
    <div className="max-w-205">
      <h1 data-display className="text-2xl leading-tight font-bold text-white/95 md:text-3xl">Which order is it about?</h1>
      <p className="mt-2 text-base text-white/65">Pick the order and we&apos;ll attach it to your ticket.</p>

      {orders.length > 5 ? (
        <div className="relative mt-6 max-w-120">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/45" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product or order number"
            aria-label="Search your orders"
            className={ACCOUNT_SEARCH_INPUT_CLASS}
          />
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-2">
        {isLoading ? (
          Array.from({ length: 3 }, (_, i) => <div key={i} className={cn(ACCOUNT_CARD_CLASS, 'h-[78px] animate-pulse')} />)
        ) : shown.length === 0 ? (
          <p className={cn(ACCOUNT_CARD_CLASS, 'px-5 py-6 text-base text-white/65')}>
            {orders.length === 0 ? "You don't have any orders yet." : `No orders match "${query.trim()}".`}
          </p>
        ) : (
          shown.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => onSelectOrder(order)}
              className="cursor-pointer rounded-xl text-left transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <TicketOrderLine order={order} action={<ChevronRight className="size-4 shrink-0 text-white/40" aria-hidden />} />
            </button>
          ))
        )}
      </div>

      {noOrderHref ? (
        <Link
          href={noOrderHref}
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#5B93F0] hover:underline"
        >
          It&apos;s not about an order
          <ChevronRight className="size-3.5" />
        </Link>
      ) : null}
    </div>
  )
}
