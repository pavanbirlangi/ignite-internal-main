import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// English is the default locale and carries no URL prefix (e.g. "/store", not "/en/store");
// every other locale keeps its prefix (e.g. "/fr/store"). Centralized here so proxy.ts,
// lib/seo.ts, the sitemap, and every component building a locale-aware href/redirect agree.
export const DEFAULT_LOCALE = 'en'

export function localizedHref(locale: string, path: string): string {
  const normalizedPath = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`
  if (locale.toLowerCase() === DEFAULT_LOCALE) {
    return normalizedPath || '/'
  }
  return `/${locale.toLowerCase()}${normalizedPath}`
}

// Client components read the current URL via usePathname(), which (unlike useParams().locale)
// reflects what the browser actually shows -- no prefix for English, a real "/xx" prefix for
// every other locale (see localizedHref above). Route-matching logic that inspects path segments
// needs to detect and skip an optional locale prefix rather than assume a fixed position.
export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split('/')
  if (/^[a-z]{2}$/.test(segments[1] ?? '')) {
    return `/${segments.slice(2).join('/')}` || '/'
  }
  return pathname
}

export function getProxyImageUrl(url: string | null | undefined) {
  if (!url) return '';
  return url.replace('https://cdn.shopify.com', '/cdn-shopify');
}

// product.description is real HTML now (a TipTap-based rich-text editor in Medusa Admin writes
// directly into it) -- SEO surfaces (meta description, JSON-LD) need a clean plain-text excerpt,
// not raw markup.
export function stripHtml(html: string | null | undefined, maxLength = 160): string {
  if (!html) return ''
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}...` : text
}
