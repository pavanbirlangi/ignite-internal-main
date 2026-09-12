import { create } from 'zustand'
import {
  orderService,
  Order,
  GetOrdersParams,
  OrderPageInfo,
} from '@/lib/services/order.service'

export type OrderTab =
  | 'All Orders'
  | 'Paid'
  | 'Pending'
  | 'Refunded'
  | 'Fulfilled'
  | 'Unfulfilled'
  | 'Partial'


export type SortOrder = 'desc' | 'asc'

const ORDERS_PER_PAGE = 10


function getApiFiltersForTab(
  tab: OrderTab,
): Pick<GetOrdersParams, 'financialStatus' | 'fulfillmentStatus'> {
  switch (tab) {
    case 'Paid':
      return { financialStatus: 'PAID' }
    case 'Pending':
      return { financialStatus: 'PENDING' }
    case 'Refunded':
      return { financialStatus: 'REFUNDED' }
    case 'Fulfilled':
      return { fulfillmentStatus: 'FULFILLED' }
    case 'Unfulfilled':
      return { fulfillmentStatus: 'UNFULFILLED' }
    case 'Partial':
      return { fulfillmentStatus: 'PARTIAL' }
    case 'All Orders':
    default:
      return {}
  }
}

interface OrderState {
  orders: Order[]
  isLoading: boolean
  error: string | null
  activeTab: OrderTab
  searchQuery: string
  sortOrder: SortOrder
  pageInfo: OrderPageInfo
  currentCursor: string | undefined
  setActiveTab: (tab: OrderTab) => void
  setSearchQuery: (query: string) => void
  setSortOrder: (sort: SortOrder) => void
  fetchOrders: (after?: string) => Promise<void>
  fetchNextPage: () => Promise<void>
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,
  activeTab: 'All Orders',
  searchQuery: '',
  sortOrder: 'desc',
  pageInfo: { hasNextPage: false, endCursor: null },
  currentCursor: undefined,

  setActiveTab: (tab) => set({ activeTab: tab, currentCursor: undefined }),
  setSearchQuery: (query) => set({ searchQuery: query, currentCursor: undefined }),
  setSortOrder: (sort) => set({ sortOrder: sort, currentCursor: undefined }),

  fetchOrders: async (after?: string) => {
    set({ isLoading: true, error: null })
    try {
      const { activeTab, searchQuery, sortOrder } = get()
      const tabFilters = getApiFiltersForTab(activeTab)

      const params: GetOrdersParams = {
        first: ORDERS_PER_PAGE,
        sort: sortOrder,
        ...tabFilters,
        search: searchQuery.trim() || undefined,
        after,
      }

      const response = await orderService.getOrders(params)

      set({
        orders: response.orders,
        pageInfo: response.pageInfo,
        currentCursor: after,
        isLoading: false,
      })
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      set({ orders: [], isLoading: false, error: 'Failed to load orders' })
    }
  },

  fetchNextPage: async () => {
    const { pageInfo } = get()
    if (!pageInfo.hasNextPage || !pageInfo.endCursor) return
    await get().fetchOrders(pageInfo.endCursor)
  },
}))
