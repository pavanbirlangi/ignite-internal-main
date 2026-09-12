import { Metadata } from 'next'
import LegalPageContent from '@/components/legal/LegalPageContent'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import { LegalService, type LegalPage } from '@/lib/services/legal.service'
import { translateLegalData } from '@/lib/translations/legal'
import { generateSeoMetadata, getWebPageJsonLd } from '@/lib/seo'

type Props = {
  params: Promise<{ slug: string; locale: string }>
}

/** Convert a slug like "privacy-policy" to "Privacy Policy" */
function slugToLabel(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const formattedTitle = slugToLabel(slug)

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

export default async function DynamicLegalPage({ params }: Props) {
  const { slug, locale } = await params
  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: `legal/${slug}`,
    name: `${slugToLabel(slug)} | Increddy`,
    description: `Read our ${slugToLabel(slug).toLowerCase()}.`,
  })

  try {
    const [pageResponse, allPagesResponse] = await Promise.all([
      LegalService.getPageBySlug(slug),
      LegalService.getAllPages(),
    ])

    const page = pageResponse?.data?.[0]
    const allSlugs = allPagesResponse?.data?.map((p) => p.slug) || []

    if (!page) {
      return (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(webPageJsonLd),
            }}
          />
          <LegalPageContent slug={slug} />
        </>
      )
    }

    if (locale.toUpperCase() === 'EN') {
      return (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(webPageJsonLd),
            }}
          />
          <LegalPageContent slug={slug} />
        </>
      )
    }

    const { translatedPage, sidebarLabelsMap } = await translateLegalData(
      page,
      allSlugs,
      locale,
    )

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webPageJsonLd),
          }}
        />
        <LegalPageContent
          slug={slug}
          translatedContent={translatedPage}
          translatedSidebarLabels={sidebarLabelsMap}
        />
      </>
    )
  } catch (error) {
    console.error('[DynamicLegalPage] Translation failed:', error)
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webPageJsonLd),
          }}
        />
        <LegalPageContent slug={slug} />
      </>
    )
  }
}
