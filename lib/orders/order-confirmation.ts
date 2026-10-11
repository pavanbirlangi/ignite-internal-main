import { formatOrderPrice } from '@/lib/orders/order-formatters'
import { type OrderDetails } from '@/lib/services/order.service'
import { getVariantDisplayName } from '@/lib/orders/variant-title'

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
  serviceFeeLabel: string
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
    fulfillmentStatus === 'CANCELLED' ||
    fulfillmentStatus === 'CANCELED'
  ) {
    return 'failed'
  }

  // A partial refund leaves the order paid: only part of it went back to the customer.
  const isPaid = financialStatus === 'PAID' || financialStatus === 'PARTIALLY_REFUNDED'
  if (isPaid && fulfillmentStatus === 'FULFILLED') {
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
      const itemTitle =
        getVariantDisplayName(node.variant?.title) ?? (node.title || 'Untitled Product')

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
      order?.platformFee !== undefined && order?.totalPrice?.currencyCode
        ? formatOrderPrice(order.platformFee.toFixed(2), order.totalPrice.currencyCode)
        : '-',
    serviceFeeLabel: order?.platformFeeLabel || 'Service Fee',
    paymentMode: getPaymentMode(order),
    transactionNumber: orderNumber ? `${orderNumber}` : '-',
  }
}
