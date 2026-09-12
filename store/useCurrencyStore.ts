import { create } from 'zustand'
import Cookies from 'js-cookie'
import { defaultRegionSettings } from '@/lib/region-data'

const COOKIE_COUNTRY = 'user_country'
const COOKIE_CURRENCY = 'user_currency'
const COOKIE_LANGUAGE = 'user_language'

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
  isInitialized: boolean
  isLoading: boolean

  initLocation: () => Promise<void>
  setRegion: (country: string, currency: string, language: string) => Promise<void>
}

export const useCurrencyStore = create<CurrencyState>()((set, get) => ({
  // Initialize with cookies if available, otherwise default to IN/INR/EN synchronously to prevent hydration mismatch errors if used directly
  country: Cookies.get(COOKIE_COUNTRY) || 'IN',
  currency: Cookies.get(COOKIE_CURRENCY) || 'INR',
  language: Cookies.get(COOKIE_LANGUAGE) || 'EN',
  isInitialized: false,
  isLoading: false,

  initLocation: async () => {
    // 1. Check URL for SPA overrides (language prefix, currency query param) on EVERY call
    let urlCurrencyOverride: string | null = null
    let urlLanguageOverride: string | null = null

    if (typeof window !== 'undefined') {
      try {
        const { languages, currencies } = await import('@/lib/region-data')
        
        // Currency check
        const urlParams = new URLSearchParams(window.location.search)
        const qpCurrency = urlParams.get('currency')?.trim().toUpperCase()
        if (qpCurrency) {
          const isValidCurr = currencies.some(c => c.value === qpCurrency)
          if (isValidCurr) {
            urlCurrencyOverride = qpCurrency
          }
        }

        // Language check
        const pathParts = window.location.pathname.split('/')
        const firstSegment = pathParts[1]
        if (firstSegment) {
          const isValidLang = languages.some(l => l.value.toLowerCase() === firstSegment.toLowerCase())
          if (isValidLang) {
            urlLanguageOverride = firstSegment.toUpperCase()
          }
        }
      } catch (e) {
        console.error('Failed to load region data for URL parsing:', e)
      }
    }

    // 2. If already initialized, just sync any overrides from the URL (SPA navigation)
    if (get().isInitialized) {
      const updates: Partial<CurrencyState> = {}
      if (urlLanguageOverride && get().language !== urlLanguageOverride) {
        updates.language = urlLanguageOverride
      }
      if (urlCurrencyOverride && get().currency !== urlCurrencyOverride) {
        updates.currency = urlCurrencyOverride
      }
      if (Object.keys(updates).length > 0) {
        set(updates)
      }
      return
    }

    const finishInitialization = async (parsedCountry: string, parsedCurrency: string, parsedLanguage: string) => {
      let finalCurrency = parsedCurrency
      let finalCountry = parsedCountry
      
      try {
          const { marketsService } = await import('@/lib/services/markets.service')
          const { getCountryForCurrency } = await import('@/lib/region-data')
          const activeMarkets = await marketsService.getMarkets()
          if (activeMarkets.length > 0) {
            const isSupported = activeMarkets.some(m => m.currencyCode === parsedCurrency)
            if (!isSupported) {
               // Force fallback if the currency is not supported by Shopify
               const primaryMarket = activeMarkets.find(m => m.primary)
               if (primaryMarket) {
                  finalCurrency = primaryMarket.currencyCode
                  finalCountry = getCountryForCurrency(finalCurrency) || parsedCountry
               } else {
                  finalCurrency = 'INR'
                  finalCountry = 'IN'
               }
            }
          }
      } catch (e) {
          console.error('Failed to validate active markets:', e)
      }

      Cookies.set(COOKIE_COUNTRY, finalCountry, COOKIE_OPTIONS)
      Cookies.set(COOKIE_CURRENCY, finalCurrency, COOKIE_OPTIONS)
      Cookies.set(COOKIE_LANGUAGE, parsedLanguage, COOKIE_OPTIONS)

      set({
        country: finalCountry,
        currency: finalCurrency,
        language: parsedLanguage,
        isInitialized: true,
        isLoading: false,
      })
    }

    const existingCountry = Cookies.get(COOKIE_COUNTRY)
    const existingCurrency = Cookies.get(COOKIE_CURRENCY)
    const existingLanguage = Cookies.get(COOKIE_LANGUAGE)

    // 3. If cookies are already set via Proxy edge middleware or previous visit, validate and sync
    if (existingCountry && existingCurrency) {
      let getCountryFn: ((c: string) => string | undefined) | undefined
      try {
        const { getCountryForCurrency } = await import('@/lib/region-data')
        getCountryFn = getCountryForCurrency
      } catch (e) {
        console.error('Failed to load getCountryForCurrency:', e)
      }

      const effectiveCurrency = urlCurrencyOverride || existingCurrency
      const effectiveCountry = urlCurrencyOverride && getCountryFn
        ? (getCountryFn(urlCurrencyOverride) || existingCountry)
        : existingCountry
      const effectiveLanguage = urlLanguageOverride || existingLanguage || 'EN'

      await finishInitialization(effectiveCountry, effectiveCurrency, effectiveLanguage)
      return
    }

    // 4. Otherwise, we didn't get Vercel headers (e.g. local dev, or pure new visit bypassed proxy)
    // Run ipapi detection on the client side
    try {
      set({ isLoading: true })
      
      const response = await fetch('https://ipapi.co/json/')
      if (!response.ok) throw new Error('Failed to fetch from ipapi.co')
      
      const data = await response.json()
      
      const newCountry = data.country_code || 'IN'
      const defaults = defaultRegionSettings[newCountry] || defaultRegionSettings['IN']
      const newCurrency = data.currency || defaults.currency
      const newLanguage = urlLanguageOverride || 'EN'
      
      await finishInitialization(newCountry, newCurrency, newLanguage)
    } catch (error) {
      console.error('IPAPI Detection failed, falling back to defaults:', error)
      
      // Fallback with validation
      const fallLanguage = urlLanguageOverride || 'EN'
      try {
        const { marketsService } = await import('@/lib/services/markets.service')
        const activeMarkets = await marketsService.getMarkets()
        const primary = activeMarkets.find(m => m.primary)
        const fallCurrency = primary ? primary.currencyCode : 'INR'
        
        let fallCountry = 'IN'
        if (primary) {
          try {
            const { getCountryForCurrency } = await import('@/lib/region-data')
            fallCountry = getCountryForCurrency(fallCurrency) || 'IN'
          } catch {
            fallCountry = 'IN'
          }
        }
        
        Cookies.set(COOKIE_COUNTRY, fallCountry, COOKIE_OPTIONS)
        Cookies.set(COOKIE_CURRENCY, fallCurrency, COOKIE_OPTIONS)
        Cookies.set(COOKIE_LANGUAGE, fallLanguage, COOKIE_OPTIONS)
        
        set({
          country: fallCountry,
          currency: fallCurrency,
          language: fallLanguage,
          isInitialized: true,
          isLoading: false,
        })
      } catch {
        Cookies.set(COOKIE_COUNTRY, 'IN', COOKIE_OPTIONS)
        Cookies.set(COOKIE_CURRENCY, 'INR', COOKIE_OPTIONS)
        Cookies.set(COOKIE_LANGUAGE, fallLanguage, COOKIE_OPTIONS)
        
        set({
          country: 'IN',
          currency: 'INR',
          language: fallLanguage,
          isInitialized: true,
          isLoading: false,
        })
      }
    }
  },

  setRegion: async (country: string, currency: string, language: string) => {
    Cookies.set(COOKIE_COUNTRY, country, COOKIE_OPTIONS)
    Cookies.set(COOKIE_CURRENCY, currency, COOKIE_OPTIONS)
    Cookies.set(COOKIE_LANGUAGE, language, COOKIE_OPTIONS)

    set({ country, currency, language })
  },
}))
