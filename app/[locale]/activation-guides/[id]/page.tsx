import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HelpService, type GuideDetail, type GuideSummary } from '@/lib/services/help.service'
import ActivationGuideDetail from '@/components/help/activation-guides/ActivationGuideDetail'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import {
  activationGuidesLabels,
  translateActivationGuidesList,
  translateGuideDetailData,
} from '@/lib/translations/activation-guides'
import { generateSeoMetadata } from '@/lib/seo'
import { siteUrl } from '@/lib/site'
import { ORGANIZATION_ID, breadcrumbJsonLd, plainText } from '@/lib/structured-data'

interface PageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

const OTHER_GUIDES_LIMIT = 5

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

  return generateSeoMetadata(
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
}

// The guide as an article (+ breadcrumb), published by the store.
function getGuideJsonLd(guide: GuideDetail, locale: string, categoryName: string | null) {
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
        ...(categoryName && { articleSection: categoryName }),
        author: guide.author_name?.trim()
          ? { '@type': 'Person', name: guide.author_name.trim() }
          : { '@id': ORGANIZATION_ID },
        publisher: { '@id': ORGANIZATION_ID },
      },
      breadcrumbJsonLd(
        locale,
        [
          { name: 'Help Centre', path: '/help' },
          { name: 'Activation guides', path: '/activation-guides' },
          { name: plainText(guide.title) },
        ],
        url,
      ),
    ],
  }
}

// The editor's related guides first, then the same category, then the rest (list order).
function pickOtherGuides(guide: GuideDetail, all: GuideSummary[]): GuideSummary[] {
  const others = all.filter((g) => g.slug !== guide.slug)
  const related = (guide.related_guides ?? [])
    .map((item) => others.find((g) => g.slug === item.related_guides_id?.slug))
    .filter((g): g is GuideSummary => Boolean(g))
  const categorySlug = guide.category?.slug
  const sameCategory = others.filter((g) => categorySlug && g.category?.slug === categorySlug)
  const ordered = [...related, ...sameCategory, ...others]
  return ordered.filter((g, i) => ordered.indexOf(g) === i).slice(0, OTHER_GUIDES_LIMIT)
}

export default async function ActivationGuideDetailPage({ params }: PageProps) {
  const { locale, id } = await params

  const [guideResponse, page, allGuides] = await Promise.all([
    HelpService.getActivationGuideBySlug(id),
    HelpService.getActivationGuidesPage()
      .then((response) => response?.data ?? null)
      .catch(() => null),
    HelpService.getAllActivationGuides()
      .then((response) => response?.data ?? [])
      .catch((error): GuideSummary[] => {
        console.error('[ActivationGuideDetailPage] Failed to fetch other guides:', error)
        return []
      }),
  ])
  // An unknown (or unpublished) guide is a real 404.
  const guide = guideResponse?.data?.[0]
  if (!guide) notFound()

  let labels = activationGuidesLabels(page)
  let content = guide
  let guides = allGuides
  if (locale.toUpperCase() !== 'EN') {
    try {
      ;[content, { labels, guides }] = await Promise.all([
        translateGuideDetailData(guide, locale),
        translateActivationGuidesList(labels, allGuides, locale),
      ])
    } catch (error) {
      // The English text is better than no page.
      console.error('[ActivationGuideDetailPage] Translation failed:', error)
    }
  }

  // The category's name as the list shows it (translated there).
  const categoryName = guide.category?.slug
    ? (guides.find((g) => g.category?.slug === guide.category?.slug)?.category?.name ?? guide.category.name)
    : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getGuideJsonLd(guide, locale, guide.category?.name ?? null)) }}
      />
      <ActivationGuideDetail
        locale={locale}
        labels={labels}
        guide={content}
        otherGuides={pickOtherGuides(guide, guides)}
        categoryName={categoryName}
      />
    </>
  )
}
