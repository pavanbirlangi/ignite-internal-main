// The currency prices are *shown* in -- chosen in the header picker, stored in a cookie. It's
// independent of the currency a payment is *charged* in, which checkout decides per payment
// method (card -> USD, a local method -> its own currency).
export const DISPLAY_CURRENCY_COOKIE = 'user_currency'
export const DEFAULT_CURRENCY = 'usd'

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
