import { SITE_URL, siteUrl } from './site'

// Shared schema.org (JSON-LD) pieces. Every page's graph refers to the organization, website,
// return policy and delivery policy by these ids instead of repeating them (Google's merchant
// listing guide recommends store-wide policies on the Organization, referenced from each offer).
export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`
export const RETURN_POLICY_ID = `${SITE_URL}/#return-policy`
export const SHIPPING_SERVICE_ID = `${SITE_URL}/#shipping`

const SITE_DESCRIPTION =
  'Increddy sells digital game keys, gift cards and software at low prices, delivered instantly by email and in your account library.'

export interface BreadcrumbItem {
  name: string
  /** Path without locale, e.g. "/store"; omit for the current page. */
  path?: string
}

/** The store itself: who sells, how to reach support, and the store-wide refund and delivery rules. */
export function organizationJsonLd(socialUrls: string[] = []) {
  return {
    '@type': 'OnlineStore',
    '@id': ORGANIZATION_ID,
    name: 'Increddy',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/apple-icon.png`,
      width: 180,
      height: 180,
    },
    description: SITE_DESCRIPTION,
    ...(socialUrls.length > 0 && { sameAs: socialUrls }),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${SITE_URL}/contact`,
      availableLanguage: ['English'],
    },
    // Keys can't be returned once bought; a faulty key is handled within 72 hours under the
    // refund policy, which the link describes.
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      '@id': RETURN_POLICY_ID,
      returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
      merchantReturnLink: `${SITE_URL}/legal/refund-policy`,
    },
    // Digital delivery: free, same day, everywhere (no destination = worldwide).
    hasShippingService: {
      '@type': 'ShippingService',
      '@id': SHIPPING_SERVICE_ID,
      name: 'Instant digital delivery',
      description: 'Keys are delivered by email and in My Library. Nothing is shipped.',
      shippingConditions: {
        '@type': 'ShippingConditions',
        shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'USD' },
        transitTime: {
          '@type': 'ServicePeriod',
          duration: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 0, unitCode: 'DAY' },
        },
      },
    },
  }
}

/** The website, with the store search (the store page reads ?q=). */
export function websiteJsonLd(locale: string) {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: siteUrl(locale, '/'),
    name: 'Increddy',
    description: SITE_DESCRIPTION,
    inLanguage: locale.toLowerCase(),
    publisher: { '@id': ORGANIZATION_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl(locale, '/store')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/** Home > ... > current page. The first item is always Home; the last has no link (it's this page). */
export function breadcrumbJsonLd(locale: string, items: BreadcrumbItem[], currentUrl: string) {
  const all: BreadcrumbItem[] = [{ name: 'Home', path: '/' }, ...items]
  return {
    '@type': 'BreadcrumbList',
    '@id': `${currentUrl}#breadcrumb`,
    itemListElement: all.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path !== undefined ? siteUrl(locale, item.path) : currentUrl,
    })),
  }
}

/** Plain text for JSON-LD from HTML or entity-encoded text (no tags, entities decoded, spaces collapsed). */
export function plainText(value: string | null | undefined, maxLength?: number): string {
  if (!value) return ''
  const text = value
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim()
  if (!maxLength || text.length <= maxLength) return text
  const cut = text.slice(0, maxLength)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : maxLength)}...`
}
