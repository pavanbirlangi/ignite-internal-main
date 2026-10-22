import medusaClient from './medusa-axios'
import cmsClient from './cms-axios'
import { languages } from './region-data'
import { DEFAULT_LOCALE } from './utils'
import { SITE_URL, siteUrl } from './site'

// The sitemap is an index (/sitemap.xml) of one file per language (/sitemaps/<locale>.xml), each
// listing every public page once. Language alternates aren't repeated here: every page already
// declares them in its <head> (lib/seo.ts), and listing 24 alternates per URL made the old single
// sitemap 7 MB. A page only gets <lastmod> when we know when it really changed.

export const SITEMAP_LOCALES = Array.from(new Set(languages.map((l) => l.value.toLowerCase()))).sort((a, b) =>
  a === DEFAULT_LOCALE ? -1 : b === DEFAULT_LOCALE ? 1 : a.localeCompare(b),
)

export interface SitemapPage {
  path: string
  lastModified?: string
}

const STATIC_PATHS = ['/', '/store', '/categories', '/activation-guides', '/help', '/faq', '/about-us', '/contact']

async function productPages(): Promise<SitemapPage[]> {
  const pages: SitemapPage[] = []
  const limit = 200
  for (let offset = 0; offset < 10_000; offset += limit) {
    const { data } = await medusaClient.get('/store/products', {
      params: { fields: 'handle,updated_at', limit, offset },
    })
    for (const product of data.products ?? []) {
      if (product?.handle) pages.push({ path: `/${product.handle}`, lastModified: product.updated_at })
    }
    if (offset + limit >= (data.count ?? 0)) break
  }
  return pages
}

async function guidePages(): Promise<SitemapPage[]> {
  const { data } = await cmsClient.get('/items/guides?fields=slug,date_updated,published_date&limit=-1')
  return (data.data ?? [])
    .filter((guide: { slug?: string }) => guide.slug)
    .map((guide: { slug: string; date_updated?: string | null; published_date?: string | null }) => ({
      path: `/activation-guides/${guide.slug}`,
      lastModified: guide.date_updated || guide.published_date || undefined,
    }))
}

async function legalPages(): Promise<SitemapPage[]> {
  const { data } = await cmsClient.get('/items/legal_pages?fields=slug&filter[status][_eq]=published')
  return (data.data ?? []).filter((page: { slug?: string }) => page.slug).map((page: { slug: string }) => ({ path: `/legal/${page.slug}` }))
}

async function helpPages(): Promise<SitemapPage[]> {
  const [{ data: help }, { data: topics }] = await Promise.all([
    cmsClient.get('/items/help?fields=issue_types.help_issues_types_id.slug'),
    cmsClient.get('/items/help_subtopics?fields=slug,issue_type.slug&limit=-1'),
  ])
  const categories: string[] = (help.data?.issue_types ?? [])
    .map((item: { help_issues_types_id?: { slug?: string } }) => item.help_issues_types_id?.slug)
    .filter(Boolean)
  const topicPaths = (topics.data ?? [])
    .filter((topic: { slug?: string; issue_type?: { slug?: string } }) => topic.slug && topic.issue_type?.slug)
    .map((topic: { slug: string; issue_type: { slug: string } }) => ({ path: `/help/${topic.issue_type.slug}/${topic.slug}` }))
  return [...categories.map((slug) => ({ path: `/help/${slug}` })), ...topicPaths]
}

/** Every public page (paths without a locale). A source that fails is left out rather than failing the sitemap. */
export async function getSitemapPages(): Promise<SitemapPage[]> {
  const sources = await Promise.allSettled([productPages(), guidePages(), legalPages(), helpPages()])
  const dynamic = sources.flatMap((result) => {
    if (result.status === 'fulfilled') return result.value
    console.error('[sitemap] a source failed:', result.reason)
    return []
  })
  return [...STATIC_PATHS.map((path) => ({ path })), ...dynamic]
}

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

const isoDate = (value?: string) => {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function sitemapIndexXml(): string {
  const entries = SITEMAP_LOCALES.map(
    (locale) => `  <sitemap><loc>${escapeXml(`${SITE_URL}/sitemaps/${locale}.xml`)}</loc></sitemap>`,
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</sitemapindex>\n`
}

export function localeSitemapXml(locale: string, pages: SitemapPage[]): string {
  const entries = pages.map((page) => {
    const lastmod = isoDate(page.lastModified)
    return `  <url><loc>${escapeXml(siteUrl(locale, page.path))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
}

export const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
}
