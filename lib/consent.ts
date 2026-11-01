// Cookie consent for Google Consent Mode v2. Google's tags (GA4, Google Ads, through Tag Manager)
// read the consent state themselves; this file stores the visitor's choice and passes it on.
//   EU/EEA, UK, Switzerland: nothing is granted until the visitor says yes, and the cookie card
//   asks (components/CookieConsent.tsx). Everywhere else: granted by default, no card; the
//   footer's Cookie settings link lets anyone switch it off.
// The defaults themselves are set before Tag Manager loads (components/GoogleTagManager.tsx).

export const CONSENT_REGIONS = [
  // EU
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV',
  'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // Rest of the EEA, UK, Switzerland
  'IS', 'LI', 'NO', 'GB', 'CH',
]

export const CONSENT_STORAGE_KEY = 'increddy_consent'
// Asked again after a year, as EU regulators expect.
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000
export const OPEN_COOKIE_SETTINGS_EVENT = 'increddy:open-cookie-settings'

export interface ConsentChoice {
  analytics: boolean
  ads: boolean
}

export function consentModeState({ analytics, ads }: ConsentChoice) {
  const ad = ads ? 'granted' : 'denied'
  return {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: ad,
    ad_user_data: ad,
    ad_personalization: ad,
  }
}

export function getStoredConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as ConsentChoice & { at?: number }
    if (!stored.at || Date.now() - stored.at > CONSENT_MAX_AGE_MS) return null
    return { analytics: Boolean(stored.analytics), ads: Boolean(stored.ads) }
  } catch {
    return null
  }
}

export function saveConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ ...choice, at: Date.now() }))
  } catch {
    // Storage blocked: the choice still applies to this page view.
  }
  window.dataLayer = window.dataLayer || []
  // Consent Mode reads gtag-style commands from the dataLayer (an arguments object, not an array).
  // eslint-disable-next-line prefer-rest-params, @typescript-eslint/no-unused-vars
  const gtag = function gtag(..._args: unknown[]) { window.dataLayer.push(arguments) }
  gtag('consent', 'update', consentModeState(choice))
  window.dataLayer.push({ event: 'consent_update' })
}

export function needsConsentPrompt(country: string | undefined): boolean {
  return Boolean(country) && CONSENT_REGIONS.includes(String(country).toUpperCase())
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))
}
