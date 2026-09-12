import { formatOrderPrice } from '@/lib/orders/order-formatters'
import { type OrderDetails } from '@/lib/services/order.service'

export type ConfirmationState =
  | 'success-key-ready'
  | 'success-processing'
  | 'failed'

export interface OrderConfirmationViewModel {
  confirmationState: ConfirmationState
  orderCode: string
  itemSummary: string
  productImage: string
  orderAmount: string
  serviceFee: string
  paymentMode: string
  transactionNumber: string
}

function normalizeStatus(value?: string): string {
  return (value || '')
    .trim()
    .toUpperCase()
    .replace(/[-\s]+/g, '_')
}

export function getConfirmationState(
  order: OrderDetails | null,
): ConfirmationState {
  if (!order) {
    return 'failed'
  }

  const financialStatus = normalizeStatus(order.financialStatus)
  const fulfillmentStatus = normalizeStatus(order.fulfillmentStatus)

  if (
    financialStatus === 'REFUNDED' ||
    financialStatus === 'VOIDED' ||
    financialStatus === 'PARTIALLY_REFUNDED' ||
    fulfillmentStatus === 'CANCELLED' ||
    fulfillmentStatus === 'CANCELED'
  ) {
    return 'failed'
  }

  if (financialStatus === 'PAID' && fulfillmentStatus === 'FULFILLED') {
    return 'success-key-ready'
  }

  return 'success-processing'
}

function getPaymentMode(order: OrderDetails | null): string {
  if (!order) {
    return '-'
  }

  const paymentMode = [
    order.paymentMethod?.brand,
    order.paymentMethod?.lastDigits,
  ]
    .filter(Boolean)
    .join(' ')

  return paymentMode || order.paymentMethod?.gateway || 'Not available'
}

function getItemSummary(order: OrderDetails | null): string {
  const lineItems = order?.lineItems?.edges ?? []

  if (!lineItems.length) {
    return '-'
  }

  return lineItems
    .map(({ node }) => {
      const quantity = node.quantity > 1 ? `(${node.quantity}x) ` : ''
      const title = node.variant?.title
      const itemTitle =
        title && title !== 'Default Title'
          ? title
          : node.title || 'Untitled Product'

      return `${quantity}${itemTitle}`
    })
    .join(' | ')
}

export function buildOrderConfirmationViewModel(
  order: OrderDetails | null,
): OrderConfirmationViewModel {
  const orderNumber = order?.orderNumber

  return {
    confirmationState: getConfirmationState(order),
    orderCode: orderNumber ? `#${orderNumber}` : '#-',
    itemSummary: order
      ? getItemSummary(order)
      : 'Unable to load order details.',
    productImage:
      order?.lineItems?.edges?.[0]?.node?.variant?.image?.url ??
      '/images/404.png',
    orderAmount: formatOrderPrice(
      order?.totalPrice?.amount,
      order?.totalPrice?.currencyCode,
    ),
    serviceFee:
      order?.platformFee !== undefined && order?.currency
        ? formatOrderPrice(order.platformFee.toFixed(2), order.currency)
        : '-',
    paymentMode: getPaymentMode(order),
    transactionNumber: orderNumber ? `${orderNumber}` : '-',
  }
}
