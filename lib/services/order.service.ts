import medusaClient from '../medusa-axios'

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
  amount: string | number
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

// Medusa computes these from payment_collections/fulfillments on every read
// (confirmed by reading @medusajs/core-flows's getOrdersListWorkflow directly
// -- they're attached to every order object regardless of the requested
// `fields`, not real filterable DB columns), so the mapping below is a
// business decision collapsing Medusa's richer status vocabulary onto the
// simpler Shopify-style tokens the existing UI (OrderCard, useOrderStore's
// tab filters, order-confirmation.ts) already branches on.
function mapFinancialStatus(status?: string): string {
  switch (status) {
    case 'captured':
    case 'partially_captured':
      return 'PAID'
    case 'refunded':
    case 'partially_refunded':
      return 'REFUNDED'
    case 'canceled':
      return 'VOIDED'
    // `authorized`/`partially_authorized` collapse into 'PENDING' rather than
    // a separate 'AUTHORIZED' value: there's no dedicated "Authorized" tab,
    // OrderCard already colors the two identically, and the display-status
    // logic in my-orders/page.tsx already treats them as the same bucket --
    // a real "Pending" tab filter needs an authorized-but-not-captured test
    // order to actually match it (confirmed live with a real uncaptured
    // order, see the requirements/plan-doc writeup for this phase).
    case 'authorized':
    case 'partially_authorized':
    case 'not_paid':
    case 'awaiting':
    case 'requires_action':
    default:
      return 'PENDING'
  }
}

function mapFulfillmentStatus(status?: string): string {
  switch (status) {
    case 'fulfilled':
    case 'shipped':
    case 'delivered':
      return 'FULFILLED'
    case 'partially_fulfilled':
    case 'partially_shipped':
    case 'partially_delivered':
      return 'PARTIAL'
    case 'canceled':
    case 'not_fulfilled':
    default:
      return 'UNFULFILLED'
  }
}

// Medusa's order line items are fully snapshotted at order-creation time
// (thumbnail/product_title/product_handle/variant_title/variant_sku all live
// directly on the line item itself, confirmed by reading
// @medusajs/order's line-item model) -- no separate product/variant lookup
// needed. `variant_option_values`/product tags/categories have no equivalent
// here; left as honest empty arrays, matching the same no-op precedent
// already shipped for this exact modal in library.service.ts (Phase 8).
function mapLineItem(item: any, currencyCode: string): OrderLineItemEdge {
  return {
    node: {
      title: item.product_title || item.title || 'Untitled Product',
      quantity: item.quantity ?? 1,
      variant: {
        id: item.variant_id ?? '',
        title: item.variant_title ?? '',
        sku: item.variant_sku ?? null,
        selectedOptions: [],
        price: { amount: item.unit_price ?? 0, currencyCode },
        image: item.thumbnail ? { url: item.thumbnail, altText: null } : null,
        product: {
          handle: item.product_handle ?? '',
          tags: [],
          collections: undefined,
        },
      },
      categories: [],
      tags: [],
      variant_info: {
        id: item.variant_id ?? '',
        title: item.variant_title ?? '',
        sku: item.variant_sku ?? null,
        selectedOptions: [],
      },
    },
  }
}

function mapOrder(raw: any): Order {
  const currencyCode = raw.currency_code ?? 'usd'

  return {
    id: raw.id,
    orderNumber: raw.display_id,
    processedAt: raw.created_at,
    financialStatus: mapFinancialStatus(raw.payment_status),
    fulfillmentStatus: mapFulfillmentStatus(raw.fulfillment_status),
    totalPrice: { amount: raw.total ?? 0, currencyCode },
    lineItems: {
      edges: (raw.items ?? []).map((item: any) => mapLineItem(item, currencyCode)),
    },
  }
}

// No dedicated backend endpoint filters orders by these computed statuses at
// the DB level (confirmed live -- see the requirements doc), so this fetches
// the customer's own orders (core `GET /store/orders`, already
// customer-authenticated and auto-scoped to `req.auth_context.actor_id`
// server-side) and does status/search/sort/pagination in memory, the same
// approach the backend's own (unused here) `/store/orders/filtered` route
// takes internally. `MAX_ORDERS_FETCH` is a stopgap ceiling appropriate for
// today's demo-scale order counts, same spirit as the documented `R-10`/
// `R-14` scale caveats from earlier phases.
const MAX_ORDERS_FETCH = 100
const DEFAULT_PAGE_SIZE = 10

export const orderService = {
  getOrders: async (
    params: GetOrdersParams = {},
  ): Promise<GetOrdersResponse> => {
    const { data } = await medusaClient.get('/store/orders', {
      params: { limit: MAX_ORDERS_FETCH, offset: 0 },
    })

    let orders: Order[] = (data.orders ?? []).map(mapOrder)

    if (params.financialStatus) {
      orders = orders.filter((o) => o.financialStatus === params.financialStatus)
    }
    if (params.fulfillmentStatus) {
      orders = orders.filter((o) => o.fulfillmentStatus === params.fulfillmentStatus)
    }

    const search = params.search?.trim().toLowerCase()
    if (search) {
      orders = orders.filter((o) => {
        if (String(o.orderNumber).toLowerCase().includes(search)) return true
        return o.lineItems.edges.some((e) =>
          e.node.title.toLowerCase().includes(search),
        )
      })
    }

    orders.sort((a, b) => {
      const diff =
        new Date(a.processedAt).getTime() - new Date(b.processedAt).getTime()
      return params.sort === 'asc' ? diff : -diff
    })

    const pageSize = params.first ?? DEFAULT_PAGE_SIZE
    const offset = params.after ? parseInt(params.after, 10) || 0 : 0
    const pageItems = orders.slice(offset, offset + pageSize)
    const nextOffset = offset + pageSize
    const hasNextPage = nextOffset < orders.length

    return {
      orders: pageItems,
      pageInfo: {
        hasNextPage,
        endCursor: hasNextPage ? String(nextOffset) : null,
      },
    }
  },

  getOrderById: async (id: string): Promise<OrderDetails> => {
    const encodedId = encodeURIComponent(id)

    // Real security gap, confirmed live: core `GET /store/orders/:id` has NO
    // authentication and NO ownership check at all (Medusa's own source even
    // carries a `// TODO: Do we want to apply some sort of authentication
    // here?` comment on it) -- an unauthenticated request with just the
    // public publishable key returns another customer's full order (email,
    // address, totals, items). Logged as a critical item in
    // MEDUSA_MIGRATION_BACKEND_REQUIREMENTS.md. Until the backend fixes it,
    // the payment-method route -- which *is* customer-authenticated and
    // ownership-checked server-side (confirmed by reading its source) -- is
    // fetched alongside the detail call and is what actually gates this
    // page: if it rejects (order not found / not this customer's), the
    // whole call rejects and the detail response is never returned to the
    // caller, regardless of whether that request itself already resolved.
    const [paymentMethodResponse, orderResponse] = await Promise.all([
      medusaClient.get(`/store/orders/${encodedId}/payment-method`),
      medusaClient.get(`/store/orders/${encodedId}`),
    ])

    const raw = orderResponse.data?.order
    if (!raw) {
      throw new Error('Invalid order details response')
    }

    const base = mapOrder(raw)
    const currencyCode = raw.currency_code ?? base.totalPrice.currencyCode
    const paymentMethod = paymentMethodResponse.data ?? {}

    return {
      ...base,
      subtotalPriceV2: { amount: raw.subtotal ?? 0, currencyCode },
      totalTaxV2: { amount: raw.tax_total ?? 0, currencyCode },
      totalRefundedV2: {
        amount: raw.summary?.refunded_total ?? 0,
        currencyCode,
      },
      // Confirmed live: this backend route has never been exercised against
      // a real Stripe charge (only the `pp_system_default` test provider),
      // so brand/last4 legitimately come back null for every test order --
      // rendered as an optional/nullable "gateway only" state, not an error.
      paymentMethod: {
        gateway: paymentMethod.gateway ?? null,
        brand: paymentMethod.brand ?? null,
        lastDigits: paymentMethod.last4 ?? null,
      },
      // No Medusa equivalent of Shopify's platform/service fee -- left
      // undefined (honest no-op) rather than fabricated, same precedent as
      // R-09's tax-line decision.
    }
  },
}
