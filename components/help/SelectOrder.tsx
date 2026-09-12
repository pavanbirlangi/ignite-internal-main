'use client'

import { useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import type { SelectOrderProps } from '@/types/HelpTypes'

function OrderRowSkeleton() {
  return (
    <div className="border-border/40 flex animate-pulse gap-4 border-b p-4">
      <div className="bg-secondary h-4 w-24 rounded" />
      <div className="bg-secondary h-4 flex-1 rounded" />
      <div className="bg-secondary h-4 w-20 rounded" />
    </div>
  )
}

export function SelectOrder({
  orders,
  onBack,
  onSelectOrder,
  isLoading = false,
}: SelectOrderProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase()
    return (
      order.id.toLowerCase().includes(q) ||
      order.products.toLowerCase().includes(q)
    )
  })

  return (
    <div className="mx-auto w-full max-w-195">
      <div className="border-border bg-secondary/40 rounded-[20px] border p-6 md:p-8">
        {/* Header */}
        <div className="mb-1 flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="hover:text-muted-foreground cursor-pointer text-white transition-colors"
              aria-label="Go back"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 12H5M5 12L12 19M5 12L12 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-semibold text-white md:text-[28px]">
            Select an order?
          </h1>
        </div>
        <p
          className={`text-muted-foreground mb-6 text-sm font-medium ${onBack ? 'pl-9' : ''}`}
        >
          Please select an order from your history to raise a ticket.
        </p>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search for Product, Order ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
            className="border-border bg-secondary placeholder:text-muted-foreground focus:ring-primary w-full rounded-[6px] border py-2.5 pr-4 pl-10 text-sm font-medium text-white focus:ring-1 focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Orders List */}
        <div className="max-h-100 overflow-y-auto">
          <div className="bg-secondary text-muted-foreground border-border sticky top-0 z-10 hidden grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)_24px] items-center gap-4 border-b px-4 py-3 text-xs font-semibold tracking-wider md:grid">
            <span>Order ID</span>
            <span>Products</span>
            <span>Purchase Date</span>
            <span className="sr-only">Action</span>
          </div>

          {/* Loading skeletons */}
          {isLoading && (
            <>
              <OrderRowSkeleton />
              <OrderRowSkeleton />
              <OrderRowSkeleton />
              <OrderRowSkeleton />
            </>
          )}

          {/* Order rows */}
          {!isLoading &&
            filteredOrders.map((order, index) => (
              <button
                key={`${order.id}-${index}`}
                onClick={() => onSelectOrder(order)}
                className="hover:bg-secondary/40 border-border/40 relative flex w-full cursor-pointer flex-col gap-2 border-b p-4 text-left transition-colors md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)_24px] md:items-center md:gap-4 md:border-none"
              >
                <div className="flex items-center justify-between md:contents">
                  <span className="truncate text-[14px] font-medium text-white md:text-[12px]">
                    {order.id}
                  </span>
                  {/* Date shown next to ID on mobile */}
                  <span className="text-muted-foreground text-[12px] font-medium md:hidden">
                    {order.purchaseDate}
                  </span>
                </div>

                <span className="text-muted-foreground line-clamp-2 text-[13px] font-medium md:max-w-50 md:text-[12px] md:text-white">
                  {order.products}
                </span>

                {/* Date hidden on mobile here since it's moved up */}
                <span className="hidden text-[12px] text-white md:block">
                  {order.purchaseDate}
                </span>

                <ChevronRight className="absolute top-1/2 right-4 size-4 shrink-0 -translate-y-1/2 text-white md:static md:translate-y-0 md:justify-self-end" />
              </button>
            ))}
        </div>

        {!isLoading && filteredOrders.length === 0 && (
          <div className="text-muted-foreground py-10 text-center text-sm">
            {orders.length === 0
              ? 'No orders found in your account.'
              : 'No orders found matching your search.'}
          </div>
        )}
      </div>
    </div>
  )
}
