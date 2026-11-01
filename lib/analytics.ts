// Events for Google Tag Manager (components/GoogleTagManager.tsx). The site only says what
// happened, in GA4's ecommerce format; the container decides which tags get it (GA4 for the
// shopping events, the Google Ads conversion for purchase). GA4's own `purchase` comes from the
// backend (R-95), so the browser's purchase push is for Google Ads only.
// item_id is the variant id: the Merchant Center feed's g:id, so Google Ads can match sales and
// remarketing to feed products; the backend's GA4 purchase uses the same id.

export interface AnalyticsItem {
  item_id: string
  item_name: string
  item_variant?: string
  item_category?: string
  price: number
  quantity: number
}

interface EcommerceData {
  currency: string
  value: number
  items: AnalyticsItem[]
  transaction_id?: string
  coupon?: string
}

function push(entry: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(entry)
}

const round = (amount: number) => Math.round(amount * 100) / 100

export function trackEcommerce(
  event: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase',
  data: EcommerceData,
  extra?: Record<string, unknown>,
) {
  // Google's recommendation: clear the previous ecommerce object so its fields don't carry over.
  push({ ecommerce: null })
  push({
    event,
    ecommerce: {
      ...data,
      currency: data.currency.toUpperCase(),
      value: round(data.value),
      items: data.items.map((item) => ({ ...item, price: round(item.price) })),
    },
    ...extra,
  })
}

const TRACKED_ORDERS_KEY = 'increddy_tracked_orders'

// The confirmation page can be reloaded or revisited; each order is reported once per browser.
// Google Ads also drops a repeated transaction_id, this just keeps the noise out.
export function trackPurchaseOnce(data: EcommerceData & { transaction_id: string }, email?: string | null) {
  if (typeof window === 'undefined') return
  let tracked: string[] = []
  try {
    tracked = JSON.parse(window.localStorage.getItem(TRACKED_ORDERS_KEY) || '[]')
  } catch {
    tracked = []
  }
  if (tracked.includes(data.transaction_id)) return

  // user_data.email feeds enhanced conversions; the Google tag hashes it before sending.
  trackEcommerce('purchase', data, email ? { user_data: { email: email.trim().toLowerCase() } } : undefined)

  try {
    window.localStorage.setItem(TRACKED_ORDERS_KEY, JSON.stringify([...tracked, data.transaction_id].slice(-50)))
  } catch {
    // Storage blocked: the repeat (if any) is still dropped by Google on transaction_id.
  }
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

// The GA4 visitor (client id) and visit (session id) from the Google tag's own cookies, for the
// cart's metadata: the backend's purchase event (R-95) then counts in this visit, with its source.
//   _ga            GA1.1.<client id: two numbers>
//   _ga_<stream>   GS1.1.<session id>.<...>  or the newer  GS2.1.s<session id>$o1$g0...
export function getGaVisitorIds(): { ga_client_id?: string; ga_session_id?: string } {
  if (typeof document === 'undefined') return {}
  const ids: { ga_client_id?: string; ga_session_id?: string } = {}

  const ga = readCookie('_ga')?.split('.')
  if (ga && ga.length >= 4) ids.ga_client_id = `${ga[2]}.${ga[3]}`

  const streamCookie = document.cookie
    .split('; ')
    .find((part) => part.startsWith('_ga_'))
    ?.split('=')[1]
  if (streamCookie) {
    const parts = decodeURIComponent(streamCookie).split('.')
    const session = parts[2]?.startsWith('s') ? parts[2].slice(1).split('$')[0] : parts[2]
    if (session && /^\d+$/.test(session)) ids.ga_session_id = session
  }
  return ids
}
