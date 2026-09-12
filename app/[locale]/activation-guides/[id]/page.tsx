import { HelpService } from '@/lib/services/help.service'
import ActivationGuideDetail from '@/components/help/activation-guides/ActivationGuideDetail'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import { translateGuideDetailData } from '@/lib/translations/activation-guides'
import type { Metadata } from 'next'
import { generateSeoMetadata } from '@/lib/seo'
import type { GuideDetail } from '@/lib/services/help.service'

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

function getGuideJsonLd(guide: GuideDetail, locale: string) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || 'https://increddy.com'
  const cmsBase = process.env.NEXT_PUBLIC_CMS_API_URL?.replace(/\/+$/, '')
  const image = guide.image && cmsBase ? `${cmsBase}/assets/${guide.image}` : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    ...(image && { image }),
    url: `${siteUrl}/${locale.toLowerCase()}/activation-guides/${guide.slug}`,
    datePublished: guide.published_date,
    ...(guide.date_updated && { dateModified: guide.date_updated }),
    author: {
      '@type': 'Person',
      name: guide.author_name,
      ...(guide.author_profile && { url: guide.author_profile }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Increddy',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/${locale.toLowerCase()}/activation-guides/${guide.slug}`,
    },
  }
}

export default async function ActivationGuideDetailPage({ params }: PageProps) {
  const { locale, id } = await params

  try {
    const response = await HelpService.getActivationGuideBySlug(id)
    const guide = response?.data?.[0]

    if (!guide) {
      return <ActivationGuideDetail id={id} />
    }

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
    console.error('[ActivationGuideDetailPage] Failed to fetch/translate content:', error)
    return <ActivationGuideDetail id={id} />
  }
}

