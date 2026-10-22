import type { Metadata } from 'next'
import { languages } from './region-data'
import { translateTextsWithLangbly } from './services/langbly-translation.service'
import { DEFAULT_LOCALE, localizedHref } from './utils'
import { SITE_URL, siteUrl } from './site'
import { WEBSITE_ID, breadcrumbJsonLd, type BreadcrumbItem } from './structured-data'

export interface SeoData {
  id?: string
  status?: string
  meta_title?: string | null
  meta_description?: string | null
  keywords?: string[] | null
  index?: boolean | null
  follow?: boolean | null
  og_image?: string | null
}

interface WebPageJsonLdOptions {
  locale: string
  pathname: string
  name: string
  description?: string
  /** schema.org page type, e.g. CollectionPage, AboutPage, ContactPage, FAQPage. Default WebPage. */
  type?: string
  /** Trail after Home; the last item is this page (give it no path). */
  breadcrumbs?: BreadcrumbItem[]
  /** What the page is mainly about (e.g. the FAQ's questions). */
  mainEntity?: unknown
}

type SeoTranslateFn = (
  texts: string[],
  locale: string,
) => Promise<string[]>

/** All supported locale codes derived from region-data languages */
const SUPPORTED_LOCALES = Array.from(new Set(languages.map((l) => l.value.toLowerCase())))

function getSiteUrl(): string {
  return SITE_URL
}

/**
 * Build the canonical URL for the current page.
 * @param locale  – current locale (e.g. "en", "fr")
 * @param pathname – path after the locale segment, WITHOUT leading slash (e.g. "store", "about-us", "")
 */
function buildCanonicalUrl(locale: string, pathname: string): string {
  const base = getSiteUrl()
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '')
  return `${base}${localizedHref(locale, cleanPath ? `/${cleanPath}` : '/')}`
}

/**
 * Build hreflang alternate links for every supported locale + x-default.
 */
function buildAlternates(locale: string, pathname: string) {
  const base = getSiteUrl()
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '')
  const suffix = cleanPath ? `/${cleanPath}` : '/'

  const languageAlternates: Record<string, string> = {}
  for (const code of SUPPORTED_LOCALES) {
    languageAlternates[code] = `${base}${localizedHref(code, suffix)}`
  }

  return {
    canonical: buildCanonicalUrl(locale, pathname),
    languages: {
      ...languageAlternates,
      'x-default': `${base}${localizedHref(DEFAULT_LOCALE, suffix)}`,
    },
  }
}

/**
 * Generate a complete Next.js Metadata object from the CMS SEO fields.
 * Automatically translates meta_title, meta_description, and keywords
 * for non-English locales using Langbly.
 *
 * @param seo       – SEO data from the CMS API (nullable)
 * @param locale    – current locale code (e.g. "en", "de")
 * @param pathname  – path after the locale segment, e.g. "store", "about-us", "" for homepage
 * @param fallbackTitle       – fallback page title
 * @param fallbackDescription – fallback meta description
 */
export async function generateSeoMetadata(
  seo: SeoData | null | undefined,
  locale: string,
  pathname: string,
  fallbackTitle?: string,
  fallbackDescription?: string,
  translateFn: SeoTranslateFn = translateTextsWithLangbly,
): Promise<Metadata> {
  let title = seo?.meta_title || fallbackTitle || 'Increddy'
  let description =
    seo?.meta_description ||
    fallbackDescription ||
    'Your premium game key destination.'
  let keywords =
    seo?.keywords && seo.keywords.length > 0 ? [...seo.keywords] : []

  // Translate meta fields for non-English locales — batch all in one call
  if (locale.toUpperCase() !== 'EN') {
    try {
      const textsToTranslate = [title, description, ...keywords]
      const translated = await translateFn(textsToTranslate, locale)
      title = translated[0]
      description = translated[1]
      if (keywords.length > 0) {
        keywords = translated.slice(2)
      }
    } catch (error) {
      console.error(
        '[SEO] Translation of meta fields failed, using originals:',
        error,
      )
    }
  }

  const metadata: Metadata = {
    title,
    description,
    alternates: buildAlternates(locale.toLowerCase(), pathname),
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Increddy',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: seo?.index !== false,
      follow: seo?.follow !== false,
    },
  }

  // Keywords
  if (keywords.length > 0) {
    metadata.keywords = keywords
  }

  // OG image
  if (seo?.og_image) {
    const cmsBase = process.env.NEXT_PUBLIC_CMS_API_URL?.replace(/\/+$/, '')
    if (cmsBase) {
      const imageUrl = `${cmsBase}/assets/${seo.og_image}`
      metadata.openGraph = {
        ...(metadata.openGraph ?? {}),
        images: [{ url: imageUrl }],
      }
      metadata.twitter = {
        ...(metadata.twitter ?? {}),
        images: [imageUrl],
      }
    }
  }

  return metadata
}

/** "getting-started" -> "Getting Started", for breadcrumb names taken from a URL slug. */
export function slugLabel(slug: string): string {
  return decodeURIComponent(slug)
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** The page itself (+ its breadcrumb trail), linked to the site-wide website and organization. */
export function getWebPageJsonLd({
  locale,
  pathname,
  name,
  description,
  type = 'WebPage',
  breadcrumbs,
  mainEntity,
}: WebPageJsonLdOptions) {
  const normalizedLocale = locale.toLowerCase()
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '')
  const pageUrl = siteUrl(normalizedLocale, cleanPath ? `/${cleanPath}` : '/')
  const breadcrumb = breadcrumbs?.length ? breadcrumbJsonLd(normalizedLocale, breadcrumbs, pageUrl) : null

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': type,
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name,
        ...(description && { description }),
        inLanguage: normalizedLocale,
        isPartOf: { '@id': WEBSITE_ID },
        ...(breadcrumb && { breadcrumb: { '@id': breadcrumb['@id'] } }),
        ...(mainEntity !== undefined && { mainEntity }),
      },
      ...(breadcrumb ? [breadcrumb] : []),
    ],
  }
}
