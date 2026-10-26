import { formatPrice } from '@/lib/currency'
import { getCustomerOrderStatus } from '@/lib/orders/order-status'
import type { Order } from '@/lib/services/order.service'
import type { OrderItem } from '@/types/HelpTypes'

function formatOrderDate(processedAt: string): string {
  try {
    return new Date(processedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return processedAt
  }
}

// An order as the Help Centre shows it (recent orders, the ticket's order list and order line):
// the same first product, status and total as My Orders.
export function toTicketOrder(order: Order): OrderItem {
  const items = order.lineItems?.edges?.map((edge) => edge?.node).filter(Boolean) ?? []
  const first = items.find((item) => item.title?.trim() && item.variant?.product?.handle) ?? items[0]
  const title = first?.title ?? 'Unknown product'
  const extra = Math.max(0, items.length - 1)
  return {
    id: String(order.orderNumber),
    detailId: order.id,
    products: extra > 0 ? `${title} + ${extra} more` : title,
    purchaseDate: formatOrderDate(order.processedAt),
    image: first?.variant?.image?.url ?? undefined,
    total: order.totalPrice ? formatPrice(order.totalPrice.amount, order.totalPrice.currencyCode) : undefined,
    status: getCustomerOrderStatus(order),
  }
}
