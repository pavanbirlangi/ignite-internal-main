import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LegalPageContent from '@/components/legal/LegalPageContent'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import { LegalService, type LegalPage } from '@/lib/services/legal.service'
import { legalPageLabel, translateLegalData } from '@/lib/translations/legal'
import { generateSeoMetadata, getWebPageJsonLd } from '@/lib/seo'

type Props = {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const formattedTitle = legalPageLabel(slug)

  let page: LegalPage | null = null
  try {
    const response = await LegalService.getPageBySlug(slug)
    page = response?.data?.[0]
  } catch (error) {
    console.error(
      '[DynamicLegalPage] Failed to fetch data for metadata:',
      error,
    )
  }

  return generateSeoMetadata(
    page?.seo,
    locale,
    `legal/${slug}`,
    `${formattedTitle} | Increddy`,
    `Read our ${formattedTitle.toLowerCase()}.`,
    translateTextsWithLangbly,
  )
}

// Rendered on the server with the text in the HTML (search engines and link previews read it);
// an unknown slug is a real 404.
export default async function DynamicLegalPage({ params }: Props) {
  const { slug, locale } = await params

  const [pageResponse, allPagesResponse] = await Promise.all([
    LegalService.getPageBySlug(slug),
    LegalService.getAllPages().catch(() => ({ data: [] as { slug: string }[] })),
  ])
  const page = pageResponse?.data?.[0]
  if (!page) notFound()

  const slugs = allPagesResponse?.data?.map((p) => p.slug) ?? []
  const labels: Record<string, string> = Object.fromEntries(slugs.map((s) => [s, legalPageLabel(s)]))

  let content = page
  if (locale.toUpperCase() !== 'EN') {
    try {
      const { translatedPage, sidebarLabelsMap } = await translateLegalData(page, slugs, locale)
      content = translatedPage
      Object.assign(labels, sidebarLabelsMap)
    } catch (error) {
      // The English text is better than no page.
      console.error('[DynamicLegalPage] Translation failed:', error)
    }
  }

  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: `legal/${slug}`,
    name: `${legalPageLabel(slug)} | Increddy`,
    description: `Read our ${legalPageLabel(slug).toLowerCase()}.`,
    breadcrumbs: [{ name: legalPageLabel(slug) }],
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <LegalPageContent
        locale={locale}
        activeSlug={slug}
        html={content.page_content}
        pages={slugs.map((s) => ({ slug: s, label: labels[s] ?? legalPageLabel(s) }))}
      />
    </>
  )
}
