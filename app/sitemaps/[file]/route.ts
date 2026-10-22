import { getSitemapPages, localeSitemapXml, SITEMAP_LOCALES, XML_HEADERS } from '@/lib/sitemap'

// /sitemaps/<locale>.xml: every public page in that language (see lib/sitemap.ts).
export const revalidate = 3600

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const locale = file.replace(/\.xml$/, '')
  if (!file.endsWith('.xml') || !SITEMAP_LOCALES.includes(locale)) {
    return new Response('Not found', { status: 404 })
  }
  return new Response(localeSitemapXml(locale, await getSitemapPages()), { headers: XML_HEADERS })
}
