import { notFound } from 'next/navigation'
import { HelpService } from '@/lib/services/help.service'
import ActivationGuideDetail from '@/components/help/activation-guides/ActivationGuideDetail'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import { translateGuideDetailData } from '@/lib/translations/activation-guides'
import type { Metadata } from 'next'
import { generateSeoMetadata } from '@/lib/seo'
import type { GuideDetail } from '@/lib/services/help.service'
import { siteUrl } from '@/lib/site'
import { ORGANIZATION_ID, breadcrumbJsonLd, plainText } from '@/lib/structured-data'

interface PageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params

  let guide: GuideDetail | null = null
  try {
    const response = await HelpService.getActivationGuideBySlug(id)
    guide = response?.data?.[0] ?? null
  } catch (error) {
    console.error('[ActivationGuideDetailPage] Failed to fetch data for metadata:', error)
  }

  if (!guide) {
    return generateSeoMetadata(
      null,
      locale,
      `activation-guides/${id}`,
      'Activation Guide | Increddy',
      'Learn how to activate your digital products.',
    )
  }

  const baseMeta = await generateSeoMetadata(
    {
      meta_title: `${guide.title} | Increddy`,
      meta_description: guide.description,
      keywords: guide.tags || null,
      index: true,
      follow: true,
      og_image: guide.image || null,
    },
    locale,
    `activation-guides/${id}`,
    undefined,
    undefined,
    translateTextsWithLangbly,
  )

  return baseMeta
}

// The guide as an article (+ breadcrumb), published by the store.
function getGuideJsonLd(guide: GuideDetail, locale: string) {
  const url = siteUrl(locale, `/activation-guides/${guide.slug}`)
  const cmsBase = process.env.NEXT_PUBLIC_CMS_API_URL?.replace(/\/+$/, '')
  const image = guide.image && cmsBase ? `${cmsBase}/assets/${guide.image}` : undefined

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: plainText(guide.title, 110),
        ...(guide.description && { description: plainText(guide.description) }),
        ...(image && { image }),
        url,
        mainEntityOfPage: url,
        inLanguage: locale.toLowerCase(),
        ...(guide.published_date && { datePublished: guide.published_date }),
        ...((guide.date_updated || guide.published_date) && { dateModified: guide.date_updated || guide.published_date }),
        author: guide.author_name
          ? { '@type': 'Person', name: guide.author_name, ...(guide.author_profile && { url: guide.author_profile }) }
          : { '@id': ORGANIZATION_ID },
        publisher: { '@id': ORGANIZATION_ID },
      },
      breadcrumbJsonLd(locale, [{ name: 'Activation guides', path: '/activation-guides' }, { name: plainText(guide.title) }], url),
    ],
  }
}

export default async function ActivationGuideDetailPage({ params }: PageProps) {
  const { locale, id } = await params

  // An unknown guide is a real 404. Checked outside the try below: notFound() throws, and the catch
  // there would swallow it. A CMS outage still falls back to the client-side page.
  let guide: GuideDetail | undefined
  try {
    const response = await HelpService.getActivationGuideBySlug(id)
    guide = response?.data?.[0]
  } catch (error) {
    console.error('[ActivationGuideDetailPage] Failed to fetch content:', error)
    return <ActivationGuideDetail id={id} />
  }
  if (!guide) notFound()

  try {
    const translatedContent =
      locale.toUpperCase() === 'EN'
        ? guide
        : await translateGuideDetailData(guide, locale)

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getGuideJsonLd(guide, locale)),
          }}
        />
        <ActivationGuideDetail id={id} translatedContent={translatedContent} />
      </>
    )
  } catch (error) {
    console.error('[ActivationGuideDetailPage] Failed to translate content:', error)
    return <ActivationGuideDetail id={id} />
  }
}

