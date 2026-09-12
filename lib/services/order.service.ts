import apiClient from '@/lib/axios'

export interface GetOrdersParams {
  first?: number
  after?: string
  financialStatus?: string
  fulfillmentStatus?: string
  search?: string
  sort?: 'asc' | 'desc'
  country?: string
}

export interface OrderPrice {
  amount: string
  currencyCode: string
}

export interface OrderSelectedOption {
  name: string
  value: string
}

export interface OrderLineItemNode {
  title: string
  quantity: number
  variant?: {
    id: string
    title: string
    sku: string | null
    selectedOptions: OrderSelectedOption[]
    price: OrderPrice
    image?: {
      url: string
      altText: string | null
    } | null
    product?: {
      handle: string
      tags: string[]
      collections?: {
        edges: { node: { title: string } }[]
      }
    } | null
  } | null
  categories: string[]
  tags: string[]
  variant_info?: {
    id: string
    title: string
    sku: string | null
    selectedOptions: OrderSelectedOption[]
  } | null
}

export interface OrderPaymentMethod {
  gateway?: string | null
  brand?: string | null
  lastDigits?: string | null
}

export interface OrderLineItemEdge {
  node: OrderLineItemNode
}

export interface Order {
  id: string
  orderNumber: number
  processedAt: string
  financialStatus: string
  fulfillmentStatus: string
  totalPrice: OrderPrice
  lineItems: {
    edges: OrderLineItemEdge[]
  }
}

export interface OrderDetails extends Order {
  statusUrl?: string | null
  totalRefundedV2?: OrderPrice
  totalTaxV2?: OrderPrice
  subtotalPriceV2?: OrderPrice
  shippingAddress?: unknown | null
  successfulFulfillments?: unknown[]
  currency?: string
  paymentMethod?: OrderPaymentMethod | null
  platformFee?: number
}

export interface OrderPageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

export interface GetOrdersResponse {
  orders: Order[]
  pageInfo: OrderPageInfo
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toPageInfo(value: unknown): OrderPageInfo {
  if (!isRecord(value)) {
    return { hasNextPage: false, endCursor: null }
  }

  const hasNextPage = value.hasNextPage
  const endCursor = value.endCursor

  return {
    hasNextPage: typeof hasNextPage === 'boolean' ? hasNextPage : false,
    endCursor: typeof endCursor === 'string' ? endCursor : null,
  }
}

function normalizeOrdersResponse(payload: unknown): GetOrdersResponse {
  if (Array.isArray(payload)) {
    return {
      orders: payload as Order[],
      pageInfo: { hasNextPage: false, endCursor: null },
    }
  }

  if (!isRecord(payload)) {
    return {
      orders: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    }
  }

  const ordersValue = payload.orders

  if (Array.isArray(ordersValue)) {
    return {
      orders: ordersValue as Order[],
      pageInfo: toPageInfo(payload.pageInfo),
    }
  }

  if (isRecord(ordersValue)) {
    const edges = ordersValue.edges
    if (Array.isArray(edges)) {
      const orders = edges
        .map((edge) => (isRecord(edge) ? edge.node : null))
        .filter((node): node is Order => node !== null) as Order[]

      return {
        orders,
        pageInfo: toPageInfo(ordersValue.pageInfo ?? payload.pageInfo),
      }
    }
  }

  return {
    orders: [],
    pageInfo: toPageInfo(payload.pageInfo),
  }
}

function normalizeOrderDetailsResponse(payload: unknown): OrderDetails | null {
  const candidate =
    isRecord(payload) && isRecord(payload.order) ? payload.order : payload

  if (!isRecord(candidate)) {
    return null
  }

  if (typeof candidate.id !== 'string') {
    return null
  }

  return candidate as unknown as OrderDetails
}

export const orderService = {
  getOrders: async (
    params: GetOrdersParams = {},
  ): Promise<GetOrdersResponse> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([_, value]) => value !== undefined && value !== '',
      ),
    )

    const response = await apiClient.get('/orders', { params: cleanParams })
    return normalizeOrdersResponse(response.data)
  },

  getOrderById: async (id: string): Promise<OrderDetails> => {
    const response = await apiClient.get(`/orders/${encodeURIComponent(id)}`)
    const order = normalizeOrderDetailsResponse(response.data)

    if (!order) {
      throw new Error('Invalid order details response')
    }

    return order
  },
}
