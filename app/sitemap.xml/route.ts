import { sitemapIndexXml, XML_HEADERS } from '@/lib/sitemap'

// The sitemap index: one sitemap per language (see lib/sitemap.ts).
export const revalidate = 3600

export function GET() {
  return new Response(sitemapIndexXml(), { headers: XML_HEADERS })
}
