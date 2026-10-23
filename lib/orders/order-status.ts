import type { StatusTone } from '@/components/library/account-ui'

// What an order means to the customer: whether their keys have arrived, not the payment
// system's words. One status per order, used by My Orders, the order page and the
// confirmation page so they always agree. Payment details stay in the order's summary.
export type CustomerOrderStatus =
  | 'processing'
  | 'partly-delivered'
  | 'completed'
  | 'payment-pending'
  | 'refunded'
  | 'partly-refunded'
  | 'cancelled'

export function getCustomerOrderStatus(order: {
  financialStatus?: string
  fulfillmentStatus?: string
}): CustomerOrderStatus {
  const payment = order.financialStatus
  const delivery = order.fulfillmentStatus
  if (payment === 'REFUNDED') return 'refunded'
  if (payment === 'VOIDED' || delivery === 'CANCELLED' || delivery === 'CANCELED') return 'cancelled'
  if (payment === 'PARTIALLY_REFUNDED') return 'partly-refunded'
  if (payment === 'PENDING' || payment === 'AUTHORIZED') return 'payment-pending'
  if (delivery === 'FULFILLED') return 'completed'
  if (delivery === 'PARTIAL') return 'partly-delivered'
  return 'processing'
}

export const ORDER_STATUS_LABEL: Record<CustomerOrderStatus, string> = {
  processing: 'Processing',
  'partly-delivered': 'Partly delivered',
  completed: 'Completed',
  'payment-pending': 'Payment pending',
  refunded: 'Refunded',
  'partly-refunded': 'Partly refunded',
  cancelled: 'Cancelled',
}

export const ORDER_STATUS_TONE: Record<CustomerOrderStatus, StatusTone> = {
  processing: 'info',
  'partly-delivered': 'info',
  completed: 'success',
  'payment-pending': 'warning',
  refunded: 'warning',
  'partly-refunded': 'warning',
  cancelled: 'danger',
}

// My Orders tabs and the statuses each one shows (cancelled orders only appear under All).
export const ORDER_TABS = ['All Orders', 'Processing', 'Completed', 'Refunded'] as const
export type OrderTab = (typeof ORDER_TABS)[number]

export const ORDER_TAB_STATUSES: Record<Exclude<OrderTab, 'All Orders'>, CustomerOrderStatus[]> = {
  Processing: ['processing', 'partly-delivered', 'payment-pending'],
  Completed: ['completed'],
  Refunded: ['refunded', 'partly-refunded'],
}
