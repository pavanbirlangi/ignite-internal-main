import type { Metadata } from 'next'
import { languages } from './region-data'
import { translateTextsWithLangbly } from './services/langbly-translation.service'

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
}

type SeoTranslateFn = (
  texts: string[],
  locale: string,
) => Promise<string[]>

/** All supported locale codes derived from region-data languages */
const SUPPORTED_LOCALES = Array.from(new Set(languages.map((l) => l.value.toLowerCase())))
const DEFAULT_LOCALE = 'en'

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ||
    'https://increddy.com'
  )
}

/**
 * Build the canonical URL for the current page.
 * @param locale  – current locale (e.g. "en", "fr")
 * @param pathname – path after the locale segment, WITHOUT leading slash (e.g. "store", "about-us", "")
 */
function buildCanonicalUrl(locale: string, pathname: string): string {
  const base = getSiteUrl()
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '')
  return cleanPath ? `${base}/${locale}/${cleanPath}` : `${base}/${locale}`
}

/**
 * Build hreflang alternate links for every supported locale + x-default.
 */
function buildAlternates(locale: string, pathname: string) {
  const base = getSiteUrl()
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '')
  const suffix = cleanPath ? `/${cleanPath}` : ''

  const languageAlternates: Record<string, string> = {}
  for (const code of SUPPORTED_LOCALES) {
    languageAlternates[code] = `${base}/${code}${suffix}`
  }

  return {
    canonical: buildCanonicalUrl(locale, pathname),
    languages: {
      ...languageAlternates,
      'x-default': `${base}/${DEFAULT_LOCALE}${suffix}`,
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

export function getWebPageJsonLd({
  locale,
  pathname,
  name,
  description,
}: WebPageJsonLdOptions) {
  const base = getSiteUrl()
  const normalizedLocale = locale.toLowerCase()
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '')
  const pageUrl = cleanPath
    ? `${base}/${normalizedLocale}/${cleanPath}`
    : `${base}/${normalizedLocale}`

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name,
    description,
    inLanguage: normalizedLocale,
    isPartOf: {
      '@id': `${base}/#website`,
    },
  }
}
