const STORAGE_KEY = 'increddy_attribution'

export interface Attribution {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  referrer?: string
  landing_page?: string
}

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const

/**
 * Captures first-touch attribution (UTM params, referrer, landing page) once per browser and
 * persists it in localStorage until a cart consumes it (see useCartStore.initCart). Never
 * overwrites an existing record -- the first visit that brought someone here is what the client
 * wants on the order, not whichever internal page they happen to reload last.
 */
export function captureAttributionOnce(searchParams: URLSearchParams): void {
  if (typeof window === 'undefined') return
  try {
    if (window.localStorage.getItem(STORAGE_KEY)) return

    const attribution: Attribution = {}
    for (const key of UTM_KEYS) {
      const value = searchParams.get(key)
      if (value) attribution[key] = value
    }
    if (document.referrer) attribution.referrer = document.referrer
    attribution.landing_page = window.location.pathname

    // Always stored, even with no UTM/referrer -- the landing page alone (e.g. a direct visit to
    // a specific product) is still what the admin "Order source" widget wants to show.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution))
  } catch {
    // Private browsing / storage disabled -- attribution is a nice-to-have, never worth breaking on.
  }
}

export function getStoredAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Attribution) : null
  } catch {
    return null
  }
}

const AD_CLICK_KEY = 'increddy_ad_click'
const AD_CLICK_KEYS = ['gclid', 'gbraid', 'wbraid'] as const
// Google Ads credits a sale to a click for up to 90 days (the Purchase conversion's window).
const AD_CLICK_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000

export type AdClick = Partial<Record<(typeof AD_CLICK_KEYS)[number], string>>

/**
 * Google Ads click ids from the landing URL (auto-tagging). Unlike the first-touch record above,
 * the latest ad click wins: it's the one Google Ads credits. Saved on the cart with the order
 * (cart metadata) so an order can be traced back to its ad click.
 */
export function captureAdClick(searchParams: URLSearchParams): void {
  if (typeof window === 'undefined') return
  const click: AdClick = {}
  for (const key of AD_CLICK_KEYS) {
    const value = searchParams.get(key)
    if (value) click[key] = value
  }
  if (!Object.keys(click).length) return
  try {
    window.localStorage.setItem(AD_CLICK_KEY, JSON.stringify({ ...click, at: Date.now() }))
  } catch {
    // Storage disabled: Tag Manager's conversion linker still keeps the click for Google Ads.
  }
}

export function getStoredAdClick(): AdClick | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(AD_CLICK_KEY)
    if (!raw) return null
    const { at, ...click } = JSON.parse(raw) as AdClick & { at?: number }
    return at && Date.now() - at < AD_CLICK_MAX_AGE_MS ? click : null
  } catch {
    return null
  }
}
