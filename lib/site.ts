import { languages } from './region-data'
import { localizedHref } from './utils'

// The site's public origin. NEXT_PUBLIC_APP_URL wins (set per environment); the fallback is the
// live canonical host -- the bare increddy.com only redirects there, so it must never be used in
// canonical links, the sitemap or structured data.
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || 'https://www.increddy.com'

/** Absolute URL of a page in a locale, e.g. siteUrl('fr', '/store') -> https://www.increddy.com/fr/store */
export function siteUrl(locale: string, path = '/'): string {
  return `${SITE_URL}${localizedHref(locale, path)}`
}

const SUPPORTED_LOCALES = new Set(languages.map((language) => language.value.toLowerCase()))

/** False for anything that isn't one of our languages, e.g. "llms.txt" or "wp-login.php" caught by [locale]. */
export function isSupportedLocale(locale: string): boolean {
  return SUPPORTED_LOCALES.has(locale.toLowerCase())
}
