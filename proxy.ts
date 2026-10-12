import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  defaultRegionSettings,
  currencies as regionCurrencies,
  languages as regionLanguages,
  getCountryForCurrency,
} from '@/lib/region-data'
import { DEFAULT_LOCALE, localizedHref } from '@/lib/utils'
import { IP_COUNTRY_COOKIE } from '@/lib/utils/display-currency'

// /checkout is gated here (not just client-side) because guest checkout is a
// real, confirmed backend rule -- the license-key fulfillment workflow
// rejects any order with no customer_id outright, so a guest reaching
// checkout would only discover the rejection after filling out the whole
// form. Blocking at the route level avoids that dead end entirely.
const PROTECTED_ROUTES = ['/dashboard', '/checkout']
const UNAUTH_REDIRECT_PATH = '/'

async function isProtectedRouteSessionValid(
  accessToken: string,
): Promise<boolean> {
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  if (!backendUrl || !publishableKey) {
    // Avoid locking out users due to missing runtime config in middleware.
    return true
  }

  try {
    const response = await fetch(`${backendUrl}/store/customers/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-publishable-api-key': publishableKey,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    // Confirmed live: Medusa returns 401 {"message":"Unauthorized"} for a
    // missing/invalid/expired token -- no "200 with null customer" case like
    // the old Shopify-backed API had.
    if (response.status === 401 || response.status === 403) {
      return false
    }

    return true
  } catch (error) {
    // Keep route accessible if validation endpoint fails unexpectedly.
    return true
  }
}

// The currencies the admin has enabled (Medusa Admin -> Currencies), for validating ?currency=
// links such as the product feeds' (/es/minecraft-java-bedrock-edition?currency=EUR). Fetched only
// when a link carries the parameter, and cached for 5 minutes like display-currency.service.
const ENABLED_CURRENCIES_TTL_MS = 5 * 60 * 1000
let enabledCurrenciesCache: { expiresAt: number; codes: Set<string> } | null = null

async function getEnabledCurrencyCodes(): Promise<Set<string> | null> {
  if (enabledCurrenciesCache && enabledCurrenciesCache.expiresAt > Date.now()) {
    return enabledCurrenciesCache.codes
  }
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  if (!backendUrl || !publishableKey) return null

  try {
    const response = await fetch(`${backendUrl}/store/display-currencies`, {
      headers: { 'x-publishable-api-key': publishableKey },
      cache: 'no-store',
    })
    if (!response.ok) return null
    const data = (await response.json()) as { currencies?: { code: string }[] }
    const codes = new Set(['USD', ...(data.currencies ?? []).map((c) => String(c.code).toUpperCase())])
    enabledCurrenciesCache = { expiresAt: Date.now() + ENABLED_CURRENCIES_TTL_MS, codes }
    return codes
  } catch {
    return null
  }
}

function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- Handling i18n routing logic ---
  const pathParts = pathname.split('/')
  const firstSegment = pathParts[1]
  const availableLangs = regionLanguages.map((l) => l.value.toLowerCase())
  const isLocalePrefix = availableLangs.includes(
    firstSegment?.toLowerCase() || '',
  )

  // High-level safeguard: skip i18n routing for any path that looks like a static file (contains a dot)
  if (pathname.includes('.')) {
    // If it's a localized asset request (e.g. /en/icon.svg), strip the locale prefix
    if (isLocalePrefix && pathParts.length > 2) {
      const url = request.nextUrl.clone()
      url.pathname = `/${pathParts.slice(2).join('/')}`
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // English carries no URL prefix (see DEFAULT_LOCALE) -- an explicit /en/* link (old bookmark,
  // stale external link, someone typing it) is canonicalized away by redirecting to the bare
  // path, which then falls through this same middleware again and gets rewritten internally.
  if (isLocalePrefix && firstSegment.toLowerCase() === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone()
    url.pathname = `/${pathParts.slice(2).join('/')}`.replace(/\/$/, '') || '/'
    return NextResponse.redirect(url)
  }

  // --- Handle ?currency= query parameter ---
  const currencyParam = request.nextUrl.searchParams.get('currency')?.trim().toUpperCase()
  // The admin's enabled list; the built-in list only if the backend can't be reached.
  const validCurrencyCodes = currencyParam
    ? ((await getEnabledCurrencyCodes()) ?? new Set(regionCurrencies.map((c) => c.value)))
    : new Set<string>()
  let currencyOverride = false

  // If an invalid/empty currency param is present, strip it and redirect to clean URL
  if (currencyParam && !validCurrencyCodes.has(currencyParam)) {
    const cleanUrl = request.nextUrl.clone()
    cleanUrl.searchParams.delete('currency')
    return NextResponse.redirect(cleanUrl)
  }

  // If a valid currency param is present, flag for cookie override
  if (currencyParam && validCurrencyCodes.has(currencyParam)) {
    currencyOverride = true
  }

  // Mobile/desktop cookies (already existing or undefined)
  const cookieCountry = request.cookies.get('user_country')?.value
  const cookieCurrency = request.cookies.get('user_currency')?.value
  const cookieLanguage = request.cookies.get('user_language')?.value

  // Resolve country and currency — query param overrides everything
  const ipCountry = request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country')
  const countryHeader = ipCountry || 'IN'
  const country = currencyOverride
    ? getCountryForCurrency(currencyParam!)
    : (cookieCountry || countryHeader)

  // A country without its own entry shows USD (the store's default), not another country's currency.
  const defaults = defaultRegionSettings[country] || { currency: 'USD', language: 'EN' }
  const currency = currencyOverride
    ? currencyParam!
    : (cookieCurrency || defaults.currency)

  // A page's language comes from its URL alone: a prefix (/fr/...) is that language, no prefix is
  // English. The header picker can't choose a language yet, so a language remembered from a visited
  // /fr link used to redirect every unprefixed URL to French, with no way back to English.
  const language = DEFAULT_LOCALE
  const locale = isLocalePrefix ? firstSegment.toLowerCase() : language
  // The cookie just follows the page's language (the header shows it).
  const languageOverride = cookieLanguage?.toLowerCase() !== locale

  // Helper: apply region cookies to any response
  // Force-writes if currencyOverride is true (explicit user intent via URL)
  // Also force-writes the language whenever the page's language differs from the cookie
  const applyRegionCookies = (response: NextResponse, lang: string) => {
    if (!cookieCountry || currencyOverride)
      response.cookies.set('user_country', country, { path: '/' })
    if (!cookieCurrency || currencyOverride)
      response.cookies.set('user_currency', currency, { path: '/' })
    if (!cookieLanguage || languageOverride)
      response.cookies.set('user_language', lang.toUpperCase(), { path: '/' })
    // The real geo-IP country, kept apart from `user_country` (which the header picker
    // overwrites): it decides which payment methods checkout offers.
    if (ipCountry && request.cookies.get(IP_COUNTRY_COOKIE)?.value !== ipCountry)
      response.cookies.set(IP_COUNTRY_COOKIE, ipCountry, { path: '/', sameSite: 'lax' })
  }

  const pathWithoutLocale = isLocalePrefix
    ? `/${pathParts.slice(2).join('/')}`.replace(/\/$/, '') || '/'
    : pathname
  const protectedPath = isProtectedRoute(pathWithoutLocale)
  const accessToken = request.cookies.get('access_token')?.value

  if (protectedPath && !accessToken) {
    const redirectUrl = new URL(
      localizedHref(locale, UNAUTH_REDIRECT_PATH),
      request.url,
    )
    const response = NextResponse.redirect(redirectUrl)
    applyRegionCookies(response, locale)
    return response
  }

  if (protectedPath && accessToken) {
    const isSessionValid = await isProtectedRouteSessionValid(accessToken)

    if (!isSessionValid) {
      const redirectUrl = new URL(
        localizedHref(locale, UNAUTH_REDIRECT_PATH),
        request.url,
      )
      const response = NextResponse.redirect(redirectUrl)
      response.cookies.set('access_token', '', { path: '/', maxAge: 0 })
      applyRegionCookies(response, locale)
      return response
    }
  }

  if (!isLocalePrefix) {
    // English has no visible prefix -- rewrite internally to the [locale] route Next.js needs
    // (app/[locale]/...) without changing what the browser shows or triggering a redirect.
    const url = request.nextUrl.clone()
    url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`
    const response = NextResponse.rewrite(url)
    applyRegionCookies(response, language)
    return response
  }

  const response = NextResponse.next()
  applyRegionCookies(response, locale)
  return response
}

export const config = {
  // Only run middleware on paths that aren't API, _next/static, _next/image, images, fonts, favicon.ico
  matcher: ['/((?!api|_next/static|_next/image|images|fonts|favicon.ico|icon\\.svg|icon\\.png|apple-icon\\.png|manifest\\.json|sitemap.xml|robots.txt).*)'],
}
