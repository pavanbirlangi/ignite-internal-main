import { create } from 'zustand'
import Cookies from 'js-cookie'
import { defaultRegionSettings } from '@/lib/region-data'
import { getSelectableCurrencies } from '@/lib/services/locale-options.service'

const COOKIE_COUNTRY = 'user_country'
const COOKIE_CURRENCY = 'user_currency'
const COOKIE_LANGUAGE = 'user_language'

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 365,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

const FALLBACK_CURRENCY = 'USD'

// Three independent settings, as on Driffle: the country only drives the flag, the currency only
// changes how prices are displayed (the charge currency is decided at checkout per payment
// method), and the language is reserved for later.
interface CurrencyState {
  country: string
  currency: string
  language: string
  isInitialized: boolean
  isLoading: boolean

  initLocation: () => Promise<void>
  setPreferences: (country: string, currency: string, language: string) => void
}

const writeCookies = (country: string, currency: string, language: string) => {
  Cookies.set(COOKIE_COUNTRY, country, COOKIE_OPTIONS)
  Cookies.set(COOKIE_CURRENCY, currency, COOKIE_OPTIONS)
  Cookies.set(COOKIE_LANGUAGE, language, COOKIE_OPTIONS)
}

// The country's own currency if the admin offers it, otherwise USD.
const defaultCurrencyFor = (country: string, offered: Set<string>): string => {
  const local = defaultRegionSettings[country.toUpperCase()]?.currency
  return local && offered.has(local) ? local : FALLBACK_CURRENCY
}

export const useCurrencyStore = create<CurrencyState>()((set, get) => ({
  // Cookies are set by proxy.ts on the first request (country from the edge's geo-IP header), so
  // these are usually real values already; the defaults only avoid a hydration mismatch.
  country: Cookies.get(COOKIE_COUNTRY) || 'US',
  currency: Cookies.get(COOKIE_CURRENCY) || FALLBACK_CURRENCY,
  language: Cookies.get(COOKIE_LANGUAGE) || 'EN',
  isInitialized: false,
  isLoading: false,

  initLocation: async () => {
    // Language can change via an in-app navigation to a differently prefixed locale route
    // without a full reload -- checked on every call.
    let urlLanguageOverride: string | null = null
    if (typeof window !== 'undefined') {
      try {
        const { languages } = await import('@/lib/region-data')
        const firstSegment = window.location.pathname.split('/')[1]
        if (
          firstSegment &&
          languages.some((l) => l.value.toLowerCase() === firstSegment.toLowerCase())
        ) {
          urlLanguageOverride = firstSegment.toUpperCase()
        }
      } catch (e) {
        console.error('Failed to load region data for URL parsing:', e)
      }
    }

    if (get().isInitialized) {
      if (urlLanguageOverride && get().language !== urlLanguageOverride) {
        set({ language: urlLanguageOverride })
      }
      return
    }

    set({ isLoading: true })
    const language = urlLanguageOverride || Cookies.get(COOKIE_LANGUAGE) || 'EN'
    let country = Cookies.get(COOKIE_COUNTRY)

    if (!country) {
      // proxy.ts couldn't read an edge geo-IP header (e.g. local dev) -- detect client-side.
      try {
        const response = await fetch('https://ipapi.co/json/')
        if (response.ok) country = (await response.json()).country_code || undefined
      } catch (geoError) {
        console.error('IPAPI detection failed:', geoError)
      }
    }
    country = (country || 'US').toUpperCase()

    let currency = (Cookies.get(COOKIE_CURRENCY) || '').toUpperCase()
    try {
      const offered = new Set((await getSelectableCurrencies()).map((c) => c.code))
      if (!offered.has(currency)) currency = defaultCurrencyFor(country, offered)
    } catch (error) {
      console.error('Failed to load the currency list; keeping the current currency:', error)
      currency = currency || FALLBACK_CURRENCY
    }

    writeCookies(country, currency, language)
    set({ country, currency, language, isInitialized: true, isLoading: false })
  },

  setPreferences: (country, currency, language) => {
    writeCookies(country, currency, language)
    set({ country, currency, language })
  },
}))
