// The currency prices are *shown* in -- chosen in the header picker, stored in a cookie. It's
// independent of the currency a payment is *charged* in, which the payment method decides at
// checkout (card -> USD). Products, carts and orders are priced in USD (DEFAULT_CURRENCY).
export const DISPLAY_CURRENCY_COOKIE = 'user_currency'
export const DEFAULT_CURRENCY = 'usd'

// The visitor's real country from the edge's geo-IP header (set by proxy.ts on every request),
// unlike `user_country`, which the header picker overwrites and only drives the flag. Decides
// which payment methods are offered.
export const IP_COUNTRY_COOKIE = 'ip_country'

/** Lowercase ISO code of the visitor's display currency. Works server- and client-side. */
export async function getDisplayCurrency(): Promise<string> {
  let value: string | undefined
  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers')
      value = (await cookies()).get(DISPLAY_CURRENCY_COOKIE)?.value
    } catch {
      value = undefined
    }
  } else {
    const { default: Cookies } = await import('js-cookie')
    value = Cookies.get(DISPLAY_CURRENCY_COOKIE)
  }
  return (value || DEFAULT_CURRENCY).toLowerCase()
}
