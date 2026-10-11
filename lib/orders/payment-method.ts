import type { OrderPaymentMethod } from '@/lib/services/order.service'

// Stripe payment method types (`payment_method.type`) the store offers.
const METHOD_NAMES: Record<string, string> = {
  card: 'Card',
  alipay: 'Alipay',
  link: 'Link',
}

// Medusa payment provider ids, used only when the backend doesn't say which method was used.
const PROVIDER_NAMES: Record<string, string> = {
  pp_stripe_stripe: 'Stripe',
  pp_system_default: 'Manual payment',
}

/**
 * Customer-facing name of the payment method when there's no card brand/last digits to show
 * (e.g. Alipay). Never returns a raw provider id like "pp_stripe_stripe".
 */
export function getPaymentMethodName(paymentMethod?: OrderPaymentMethod | null): string {
  const type = paymentMethod?.type
  if (type) {
    return METHOD_NAMES[type] ?? type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')
  }

  const gateway = paymentMethod?.gateway
  if (gateway) {
    return PROVIDER_NAMES[gateway] ?? 'Online payment'
  }

  return 'Not available'
}
