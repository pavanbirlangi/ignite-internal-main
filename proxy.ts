import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  defaultRegionSettings,
  currencies as regionCurrencies,
  languages as regionLanguages,
  getCountryForCurrency,
} from '@/lib/region-data'

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

function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
}

function getLocalizedPath(locale: string, path: string) {
  if (path === '/') {
    return `/${locale}`
  }

  return `/${locale}${path.startsWith('/') ? path : `/${path}`}`
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

  // --- Handle ?currency= query parameter ---
  const currencyParam = request.nextUrl.searchParams.get('currency')?.trim().toUpperCase()
  const validCurrencyCodes = new Set(regionCurrencies.map((c) => c.value))
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
  const countryHeader = request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || 'IN'
  const country = currencyOverride
    ? getCountryForCurrency(currencyParam!)
    : (cookieCountry || countryHeader)

  const defaults = defaultRegionSettings[country] || defaultRegionSettings['IN']
  const currency = currencyOverride
    ? currencyParam!
    : (cookieCurrency || defaults.currency)

  // Strict default for language is 'en' unless a cookie is explicitly set
  const language = cookieLanguage?.toLowerCase() || 'en'
  
  const locale = isLocalePrefix ? firstSegment.toLowerCase() : language
  const languageOverride = isLocalePrefix && firstSegment.toLowerCase() !== (cookieLanguage?.toLowerCase() || 'en')

  // Helper: apply region cookies to any response
  // Force-writes if currencyOverride is true (explicit user intent via URL)
  // Also force-writes if languageOverride is true (explicit user intent via URL prefix)
  const applyRegionCookies = (response: NextResponse, lang: string) => {
    if (!cookieCountry || currencyOverride)
      response.cookies.set('user_country', country, { path: '/' })
    if (!cookieCurrency || currencyOverride)
      response.cookies.set('user_currency', currency, { path: '/' })
    if (!cookieLanguage || languageOverride)
      response.cookies.set('user_language', lang.toUpperCase(), { path: '/' })
  }

  const pathWithoutLocale = isLocalePrefix
    ? `/${pathParts.slice(2).join('/')}`.replace(/\/$/, '') || '/'
    : pathname
  const protectedPath = isProtectedRoute(pathWithoutLocale)
  const accessToken = request.cookies.get('access_token')?.value

  if (protectedPath && !accessToken) {
    const redirectUrl = new URL(
      getLocalizedPath(locale, UNAUTH_REDIRECT_PATH),
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
        getLocalizedPath(locale, UNAUTH_REDIRECT_PATH),
        request.url,
      )
      const response = NextResponse.redirect(redirectUrl)
      response.cookies.set('access_token', '', { path: '/', maxAge: 0 })
      applyRegionCookies(response, locale)
      return response
    }
  }

  if (!isLocalePrefix) {
    const localePath = `/${language}${pathname === '/' ? '' : pathname}`
    const url = new URL(localePath, request.url)
    url.search = request.nextUrl.search
    const response = NextResponse.redirect(url)
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
