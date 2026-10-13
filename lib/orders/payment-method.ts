import type { OrderPaymentMethod } from '@/lib/services/order.service'

// Stripe payment method types (`payment_method.type`) the store offers.
const METHOD_NAMES: Record<string, string> = {
  card: 'Card',
  alipay: 'Alipay',
  link: 'Link',
  wechat_pay: 'WeChat Pay',
  bancontact: 'Bancontact',
  eps: 'EPS',
  ideal: 'iDEAL',
  mb_way: 'MB WAY',
  p24: 'Przelewy24',
  kr_card: 'Korean card',
  kakao_pay: 'Kakao Pay',
  naver_pay: 'Naver Pay',
  payco: 'PAYCO',
  samsung_pay: 'Samsung Pay',
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

/**
 * The amount actually charged, when it was in another currency than the order's (a local method
 * such as Bancontact in EUR); null for a normal USD payment.
 */
export function getForeignCharge(
  paymentMethod: OrderPaymentMethod | null | undefined,
  orderCurrency: string | undefined,
): { currency: string; amount: number } | null {
  const currency = paymentMethod?.chargeCurrency?.toLowerCase()
  const amount = paymentMethod?.chargeAmount
  if (!currency || amount === null || amount === undefined || !Number.isFinite(amount)) return null
  if (!orderCurrency || currency === orderCurrency.toLowerCase()) return null
  return { currency, amount }
}
