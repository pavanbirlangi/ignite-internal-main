import medusaClient from '@/lib/medusa-axios'
import cmsClient from '@/lib/cms-axios'
import { SITE_URL } from '@/lib/site'
import { slugLabel } from '@/lib/seo'

// /llms.txt (llmstxt.org): a Markdown map of the site for AI agents and assistants. Lighthouse's
// agentic-browsing audit wants an H1, a summary and Markdown links; the lists come from live data
// so the file never goes stale.
export const revalidate = 3600

const link = (title: string, path: string, note?: string) =>
  `- [${title.replace(/[[\]]/g, '')}](${SITE_URL}${path})${note ? `: ${note}` : ''}`

async function guides(): Promise<string[]> {
  const { data } = await cmsClient.get('/items/guides?fields=slug,title&sort=title&limit=-1')
  return (data.data ?? [])
    .filter((guide: { slug?: string; title?: string }) => guide.slug && guide.title)
    .map((guide: { slug: string; title: string }) => link(guide.title, `/activation-guides/${guide.slug}`))
}

async function legal(): Promise<string[]> {
  const { data } = await cmsClient.get('/items/legal_pages?fields=slug&filter[status][_eq]=published')
  return (data.data ?? []).map((page: { slug: string }) => link(slugLabel(page.slug), `/legal/${page.slug}`))
}

// Products shown in the store (priced); title, platform and region from the product's metadata.
async function products(): Promise<string[]> {
  const { data } = await medusaClient.get('/store/products', {
    params: { fields: 'title,handle,metadata,*variants.calculated_price', limit: 500, order: 'title' },
  })
  return (data.products ?? [])
    .filter((product: { handle?: string; variants?: { calculated_price?: { calculated_amount?: number } }[] }) =>
      product.handle && product.variants?.some((v) => Number(v.calculated_price?.calculated_amount) > 0),
    )
    .map((product: { title: string; handle: string; metadata?: Record<string, unknown> | null }) => {
      const facts = ['platform', 'region']
        .map((key) => product.metadata?.[key])
        .map((value) => (Array.isArray(value) ? value.join(', ') : typeof value === 'string' ? value : ''))
        .filter(Boolean)
        .join(', ')
      return link(product.title, `/${product.handle}`, facts || undefined)
    })
}

const settle = async (source: () => Promise<string[]>) => {
  try {
    return await source()
  } catch (error) {
    console.error('[llms.txt] a source failed:', error)
    return []
  }
}

export async function GET() {
  const [guideLinks, legalLinks, productLinks] = await Promise.all([settle(guides), settle(legal), settle(products)])

  const sections = [
    '# Increddy',
    '',
    '> Increddy is an online store for digital game keys, gift cards and software. After payment the key is delivered instantly by email and in the customer\'s My Library; keys for products waiting for stock are delivered as soon as they arrive.',
    '',
    'Prices are shown in the visitor\'s currency and a small service fee is added at checkout. Keys are not refundable once bought; a faulty or non-working key can be reported within 72 hours under the refund policy. The site is available in 24 languages (for example /fr/store for French).',
    '',
    '## Shop',
    link('Store', '/store', 'every product, with filters for platform, genre, region and price'),
    link('Categories', '/categories', 'browse by platform and category'),
    '',
    '## Help',
    link('Help center', '/help', 'answers about activation, delivery and payments'),
    link('Activation guides', '/activation-guides', 'step-by-step guides for redeeming keys on each platform'),
    link('FAQ', '/faq', 'common questions about buying, receiving and using keys'),
    link('Contact support', '/contact', 'open a support ticket'),
    '',
    '## Policies',
    ...(legalLinks.length ? legalLinks : [link('Refund policy', '/legal/refund-policy')]),
    '',
    '## Company',
    link('About Increddy', '/about-us'),
    '',
    ...(guideLinks.length ? ['## Activation guides', ...guideLinks, ''] : []),
    ...(productLinks.length ? ['## Products', ...productLinks, ''] : []),
    '## Optional',
    link('Sitemap', '/sitemap.xml', 'every public page in every language'),
    '',
  ]

  return new Response(sections.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
