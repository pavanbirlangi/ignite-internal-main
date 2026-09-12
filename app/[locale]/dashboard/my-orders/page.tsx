'use client'

import { useEffect } from 'react'
import { OrderHeader } from '@/components/orders/OrderHeader'
import { OrderTabs } from '@/components/orders/OrderTabs'
import { OrderCard, type OrderStatus } from '@/components/orders/OrderCard'
import { useOrderStore, type OrderTab, type SortOrder } from '@/store/useOrderStore'
import type { Order } from '@/lib/services/order.service'
import { useDebounce } from '@/hooks/useDebounce'
import { formatPrice as currencyFormatPrice } from '@/lib/currency'

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatPrice(price: Order['totalPrice']): string {
  return currencyFormatPrice(price.amount, price.currencyCode)
}

function getDisplayStatus(order: Order): OrderStatus {
  if (order.financialStatus === 'REFUNDED') return 'REFUNDED'
  if (order.financialStatus === 'VOIDED') return 'VOIDED'
  if (order.fulfillmentStatus === 'FULFILLED') return 'FULFILLED'
  if (order.financialStatus === 'PAID') return 'PAID'
  if (
    order.financialStatus === 'PENDING' ||
    order.financialStatus === 'AUTHORIZED'
  )
    return 'PENDING'
  return order.financialStatus as OrderStatus
}

function getPrimaryLineItem(order: Order) {
  const lineItems = order.lineItems.edges
    .map((edge) => edge?.node)
    .filter(Boolean)

  return (
    lineItems.find((item) => {
      const hasTitle = Boolean(item.title?.trim())
      const hasHandle = Boolean(item.variant?.product?.handle)
      return hasTitle && hasHandle
    }) ?? lineItems[0]
  )
}

function getFirstLineItemTitle(order: Order): string {
  const primaryItem = getPrimaryLineItem(order)
  return primaryItem?.title ?? 'Unknown Product'
}

function getExtraItemsCount(order: Order): number {
  const lineItems = order.lineItems.edges
    .map((edge) => edge?.node)
    .filter(Boolean)

  return Math.max(0, lineItems.length - 1)
}

function getOrderImage(order: Order): string {
  const primaryItem = getPrimaryLineItem(order)
  return primaryItem?.variant?.image?.url ?? '/images/404.png'
}

function getOrderHandle(order: Order): string | undefined {
  const primaryItem = getPrimaryLineItem(order)
  return primaryItem?.variant?.product?.handle
}

export default function MyOrdersPage() {
  const {
    orders,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    fetchOrders,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    pageInfo,
    fetchNextPage,
    currentCursor,
  } = useOrderStore()

  const debouncedSearchQuery = useDebounce(searchQuery, 400)

  // Fetch orders whenever filters, sort, or search change (always from first page)
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders, activeTab, debouncedSearchQuery, sortOrder])

  const handlePrevPage = () => {
    // Go back to the first page (API cursor pagination doesn't support backward natively)
    fetchOrders()
  }

  const handleNextPage = () => {
    fetchNextPage()
  }

  const isFirstPage = !currentCursor

  return (
    <div className="min-w-0 overflow-x-hidden">
      <OrderHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onSortChange={(value: SortOrder) => setSortOrder(value)}
      />

      <div className="border-secondary mt-8 border-y py-4">
        <OrderTabs
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as OrderTab)}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-8 flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="border-secondary bg-secondary/20 h-45 animate-pulse rounded-xl border"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="border-secondary bg-secondary/20 mt-8 flex flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center">
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => fetchOrders()}
            className="bg-primary hover:bg-primary rounded-[6px] px-6 py-2 text-sm font-medium text-white transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && orders.length === 0 && (
        <div className="border-secondary bg-secondary/20 mt-8 flex flex-col items-center justify-center gap-2 rounded-xl border p-12 text-center">
          <p className="text-lg font-semibold text-white">No orders found</p>
          <p className="text-muted-foreground text-sm">
            {activeTab === 'All Orders'
              ? "You haven't placed any orders yet."
              : `No orders match the "${activeTab}" filter.`}
          </p>
        </div>
      )}

      {/* Order List */}
      {!isLoading && !error && orders.length > 0 && (
        <div className="mt-8 flex flex-col gap-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              id={`${order.orderNumber}`}
              detailId={order.id}
              productHandle={getOrderHandle(order)}
              amount={formatPrice(order.totalPrice)}
              purchaseDate={formatDate(order.processedAt)}
              status={getDisplayStatus(order)}
              image={getOrderImage(order)}
              title={getFirstLineItemTitle(order)}
              itemsCount={getExtraItemsCount(order)}
            />
          ))}
        </div>
      )}

      {/* Cursor-based Pagination */}
      {!isLoading && !error && orders.length > 0 && (!isFirstPage || pageInfo.hasNextPage) && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            onClick={handlePrevPage}
            disabled={isFirstPage}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:pointer-events-none disabled:opacity-40 rounded-[6px] px-6 py-2.5 text-sm font-medium transition-colors"
          >
            ← First Page
          </button>
          <button
            onClick={handleNextPage}
            disabled={!pageInfo.hasNextPage}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:pointer-events-none disabled:opacity-40 rounded-[6px] px-6 py-2.5 text-sm font-medium transition-colors"
          >
            Next Page →
          </button>
        </div>
      )}
    </div>
  )
}
