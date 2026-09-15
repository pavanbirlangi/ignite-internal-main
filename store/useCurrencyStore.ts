import { create } from 'zustand'
import Cookies from 'js-cookie'
import {
  getRegions,
  resolveRegionForCountry,
  type MedusaRegion,
} from '@/lib/utils/region-resolver'

const COOKIE_COUNTRY = 'user_country'
const COOKIE_CURRENCY = 'user_currency'
const COOKIE_LANGUAGE = 'user_language'
const COOKIE_REGION = 'user_region_id'

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 365,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

interface CurrencyState {
  country: string
  currency: string
  language: string
  regionId: string
  isInitialized: boolean
  isLoading: boolean

  initLocation: () => Promise<void>
  setRegion: (
    regionId: string,
    country: string,
    currency: string,
    language: string,
  ) => Promise<void>
}

export const useCurrencyStore = create<CurrencyState>()((set, get) => ({
  // Initialize with cookies if available, otherwise a reasonable synchronous
  // default to prevent hydration mismatch errors if used directly before
  // initLocation() has had a chance to resolve a real region.
  country: Cookies.get(COOKIE_COUNTRY) || 'US',
  currency: Cookies.get(COOKIE_CURRENCY) || 'USD',
  language: Cookies.get(COOKIE_LANGUAGE) || 'EN',
  regionId: Cookies.get(COOKIE_REGION) || '',
  isInitialized: false,
  isLoading: false,

  initLocation: async () => {
    // Language can change via an in-app SPA navigation to a differently
    // prefixed locale route without a full reload -- checked on every call.
    // Currency/region changes always go through a full `window.location.href`
    // navigation (see LanguageModal.tsx's handleSave), which re-runs this
    // whole function fresh via proxy.ts's own cookie-setting, so there's no
    // equivalent "sync from URL" case needed for those here.
    let urlLanguageOverride: string | null = null
    if (typeof window !== 'undefined') {
      try {
        const { languages } = await import('@/lib/region-data')
        const pathParts = window.location.pathname.split('/')
        const firstSegment = pathParts[1]
        if (firstSegment) {
          const isValidLang = languages.some(
            (l) => l.value.toLowerCase() === firstSegment.toLowerCase(),
          )
          if (isValidLang) {
            urlLanguageOverride = firstSegment.toUpperCase()
          }
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

    const applyRegion = (
      region: MedusaRegion,
      country: string,
      language: string,
    ) => {
      Cookies.set(COOKIE_COUNTRY, country, COOKIE_OPTIONS)
      Cookies.set(COOKIE_CURRENCY, region.currencyCode, COOKIE_OPTIONS)
      Cookies.set(COOKIE_LANGUAGE, language, COOKIE_OPTIONS)
      Cookies.set(COOKIE_REGION, region.id, COOKIE_OPTIONS)

      set({
        country,
        currency: region.currencyCode,
        language,
        regionId: region.id,
        isInitialized: true,
        isLoading: false,
      })
    }

    set({ isLoading: true })

    const language = urlLanguageOverride || Cookies.get(COOKIE_LANGUAGE) || 'EN'
    let countryGuess = Cookies.get(COOKIE_COUNTRY)

    try {
      if (!countryGuess) {
        // No cookie yet (e.g. proxy.ts's edge headers weren't available, or
        // this is local dev) -- geo-IP detect client-side. Unrelated to
        // currency/region data itself, just a country signal to match
        // against real regions below.
        try {
          const response = await fetch('https://ipapi.co/json/')
          if (response.ok) {
            const data = await response.json()
            countryGuess = data.country_code || undefined
          }
        } catch (geoError) {
          console.error('IPAPI detection failed:', geoError)
        }
      }

      const region = await resolveRegionForCountry(countryGuess)

      // Keep the displayed country consistent with the region actually
      // resolved -- if the guess didn't match any real region (fell back to
      // the first one), show one of that region's own countries rather than
      // a mismatched flag/label.
      const country =
        countryGuess && region.countries.includes(countryGuess.toLowerCase())
          ? countryGuess.toUpperCase()
          : (region.countries[0] || 'US').toUpperCase()

      applyRegion(region, country, language)
    } catch (error) {
      console.error(
        'Region detection failed, falling back to the first configured region:',
        error,
      )
      try {
        const regions = await getRegions()
        const region = regions[0]
        applyRegion(region, (region.countries[0] || 'US').toUpperCase(), language)
      } catch (fallbackError) {
        console.error('Failed to load any region at all:', fallbackError)
        set({ isLoading: false, isInitialized: true })
      }
    }
  },

  setRegion: async (regionId, country, currency, language) => {
    Cookies.set(COOKIE_COUNTRY, country, COOKIE_OPTIONS)
    Cookies.set(COOKIE_CURRENCY, currency, COOKIE_OPTIONS)
    Cookies.set(COOKIE_LANGUAGE, language, COOKIE_OPTIONS)
    Cookies.set(COOKIE_REGION, regionId, COOKIE_OPTIONS)

    set({ regionId, country, currency, language })
  },
}))
