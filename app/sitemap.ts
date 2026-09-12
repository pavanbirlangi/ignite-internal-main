import type { MetadataRoute } from 'next'
import { languages } from '@/lib/region-data'
import { ProductService } from '@/lib/services/product.service'
import { LegalService } from '@/lib/services/legal.service'
import { HelpService } from '@/lib/services/help.service'

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ||
  'https://increddy.com'

const DEFAULT_LOCALE = 'en'
const LOCALES = Array.from(
  new Set(languages.map((l) => l.value.toLowerCase())),
).sort((a, b) => {
  if (a === DEFAULT_LOCALE) return -1
  if (b === DEFAULT_LOCALE) return 1
  return 0
})

/** Static pages that exist for every locale */
const STATIC_PAGES = [
  '', // homepage
  'store',
  'help',
  'about-us',
  'contact',
  'activation-guides',
]

function getApiErrors(response: unknown): unknown {
  if (!response || typeof response !== 'object') return undefined
  return (response as { errors?: unknown }).errors
}

function localizedEntry(
  pathname: string,
  options: {
    changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency']
    priority?: number
    localePriorityOffset?: number
  } = {},
): MetadataRoute.Sitemap {
  const suffix = pathname ? `/${pathname}` : ''
  const priority = options.priority ?? 0.8
  const localePriorityOffset = options.localePriorityOffset ?? 0.1

  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}${suffix}`,
    lastModified: new Date(),
    changeFrequency: options.changeFrequency ?? 'weekly',
    priority:
      locale === DEFAULT_LOCALE
        ? priority
        : Math.max(priority - localePriorityOffset, 0.1),
    alternates: {
      languages: Object.fromEntries([
        ...LOCALES.map((l) => [l, `${SITE_URL}/${l}${suffix}`]),
        ['x-default', `${SITE_URL}/${DEFAULT_LOCALE}${suffix}`],
      ]),
    },
  }))
}

async function getProductSlugs(): Promise<string[]> {
  const slugs: string[] = []
  let cursor: string | null = null
  const MAX_PAGES = 20 // safety limit

  for (let page = 0; page < MAX_PAGES; page++) {
    try {
      const response = await ProductService.getProducts({
        first: 100,
        ...(cursor ? { after: cursor } : {}),
      })

      const errors = getApiErrors(response)
      if (errors) {
        console.error('[Sitemap] API returned errors:', errors)
        break
      }

      const products = response?.products || []
      for (const product of products) {
        if (product?.handle) slugs.push(product.handle)
      }

      const pageInfo = response?.pageInfo
      if (!pageInfo?.hasNextPage || !pageInfo?.endCursor) break
      cursor = pageInfo.endCursor
    } catch (error) {
      console.error('[Sitemap] Failed to fetch products page:', error)
      break
    }
  }
  return slugs
}

async function getLegalSlugs(): Promise<string[]> {
  try {
    const response = await LegalService.getAllPages()
    return response.data?.map((p) => p.slug) ?? []
  } catch {
    return []
  }
}

async function getGuideSlugs(): Promise<string[]> {
  try {
    const response = await HelpService.getActivationGuides()
    return (
      response.data?.guides?.map((g) => g.guides_id?.slug).filter(Boolean) ?? []
    )
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static pages
  const staticEntries = STATIC_PAGES.flatMap((page) =>
    localizedEntry(page, {
      changeFrequency: page === '' ? 'daily' : 'weekly',
      priority: page === '' ? 1.0 : 0.8,
    }),
  )

  // 2. Product pages
  const productSlugs = await getProductSlugs()
  const productEntries = productSlugs.flatMap((slug) =>
    localizedEntry(slug, { changeFrequency: 'daily', priority: 0.9 }),
  )

  // 3. Legal pages
  const legalSlugs = await getLegalSlugs()
  const legalEntries = legalSlugs.flatMap((slug) =>
    localizedEntry(`legal/${slug}`, {
      changeFrequency: 'monthly',
      priority: 0.4,
    }),
  )

  // 4. Activation guide pages
  const guideSlugs = await getGuideSlugs()
  const guideEntries = guideSlugs.flatMap((slug) =>
    localizedEntry(`activation-guides/${slug}`, {
      changeFrequency: 'monthly',
      priority: 0.6,
    }),
  )

  return [...staticEntries, ...productEntries, ...legalEntries, ...guideEntries]
}
