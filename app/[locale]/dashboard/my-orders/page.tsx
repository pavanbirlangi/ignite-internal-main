'use client'

import { useEffect } from 'react'
import { OrderHeader } from '@/components/orders/OrderHeader'
import { OrderTabs } from '@/components/orders/OrderTabs'
import { OrderCard } from '@/components/orders/OrderCard'
import { getCustomerOrderStatus, type OrderTab } from '@/lib/orders/order-status'
import { useOrderStore, type SortOrder } from '@/store/useOrderStore'
import type { Order } from '@/lib/services/order.service'
import { useDebounce } from '@/hooks/useDebounce'
import { formatPrice as currencyFormatPrice } from '@/lib/currency'
import { ACCOUNT_PRIMARY_BUTTON_CLASS } from '@/components/library/account-ui'
import Pagination from '@/components/store/Pagination'

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
    currentCursor,
  } = useOrderStore()

  const debouncedSearchQuery = useDebounce(searchQuery, 400)

  // Fetch orders whenever filters, sort, or search change (always from first page)
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders, activeTab, debouncedSearchQuery, sortOrder])

  // The service pages by offset ("after" = how many orders to skip), so page N starts at (N-1) x size.
  const pageSize = pageInfo.pageSize ?? 10
  const currentPage = Math.floor((Number(currentCursor) || 0) / pageSize) + 1
  const totalPages = Math.max(1, Math.ceil((pageInfo.totalCount ?? 0) / pageSize))

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    fetchOrders(page === 1 ? undefined : String((page - 1) * pageSize))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-w-0 overflow-x-hidden">
      <OrderHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onSortChange={(value: SortOrder) => setSortOrder(value)}
      />

      <div className="mt-4">
        <OrderTabs
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as OrderTab)}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-6 flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-card border-border h-40 animate-pulse rounded-xl border"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-card border-border mt-6 flex flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center">
          <p className="text-white/65">{error}</p>
          <button
            onClick={() => fetchOrders()}
            className={ACCOUNT_PRIMARY_BUTTON_CLASS}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && orders.length === 0 && (
        <div className="bg-card border-border mt-6 flex flex-col items-center justify-center gap-2 rounded-xl border p-12 text-center">
          <p className="text-base font-bold text-white/95">No orders found</p>
          <p className="text-white/65 text-sm">
            {activeTab === 'All Orders'
              ? "You haven't placed any orders yet."
              : `No orders match the "${activeTab}" filter.`}
          </p>
        </div>
      )}

      {/* Order List */}
      {!isLoading && !error && orders.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              id={`${order.orderNumber}`}
              detailId={order.id}
              productHandle={getOrderHandle(order)}
              amount={formatPrice(order.totalPrice)}
              purchaseDate={formatDate(order.processedAt)}
              status={getCustomerOrderStatus(order)}
              image={getOrderImage(order)}
              title={getFirstLineItemTitle(order)}
              itemsCount={getExtraItemsCount(order)}
            />
          ))}
        </div>
      )}

      {!isLoading && !error && orders.length > 0 && totalPages > 1 && (
        <div className="mt-10">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}
