import { languages } from './region-data'
import { localizedHref } from './utils'

// The site's public origin. NEXT_PUBLIC_APP_URL wins (set per environment); the fallback is the
// live canonical host -- the bare increddy.com only redirects there, so it must never be used in
// canonical links, the sitemap or structured data.
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || 'https://www.increddy.com'

// Whether the language versions (/fr/..., /de/...) are really translated: the page text and titles go
// through Langbly, so without its key every language URL shows the English page. While that's the
// case they're kept out of search: no hreflang alternates, each points its canonical at the English
// page, and the sitemap lists English only. The URLs keep working for visitors and product feeds
// (/es/<product>?currency=EUR). Setting LANGBLY_API_KEY (and deploying) turns all of it back on.
export const TRANSLATIONS_ENABLED = Boolean(process.env.LANGBLY_API_KEY)

/** Absolute URL of a page in a locale, e.g. siteUrl('fr', '/store') -> https://www.increddy.com/fr/store */
export function siteUrl(locale: string, path = '/'): string {
  return `${SITE_URL}${localizedHref(locale, path)}`
}

const SUPPORTED_LOCALES = new Set(languages.map((language) => language.value.toLowerCase()))

/** False for anything that isn't one of our languages, e.g. "llms.txt" or "wp-login.php" caught by [locale]. */
export function isSupportedLocale(locale: string): boolean {
  return SUPPORTED_LOCALES.has(locale.toLowerCase())
}
