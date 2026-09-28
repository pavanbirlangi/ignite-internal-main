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
