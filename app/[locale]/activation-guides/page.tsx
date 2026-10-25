import type { Metadata } from 'next'
import { HelpService, type ActivationGuidesPageContent, type GuideSummary } from '@/lib/services/help.service'
import ActivationGuidesPage, { type HelpLink } from '@/components/help/activation-guides/ActivationGuidesPage'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import { activationGuidesLabels, translateActivationGuidesList } from '@/lib/translations/activation-guides'
import { generateSeoMetadata, getWebPageJsonLd } from '@/lib/seo'
import { localizedHref } from '@/lib/utils'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const page = await HelpService.getActivationGuidesPage()
    .then((response) => response?.data)
    .catch((error) => {
      console.error('[ActivationGuidesPage] Failed to fetch data for metadata:', error)
      return null
    })

  return generateSeoMetadata(
    page?.seo,
    locale,
    'activation-guides',
    page?.page_title || 'Activation Guides | Increddy',
    'Learn how to activate your digital products.',
    translateTextsWithLangbly,
  )
}

// The Help Centre's issue types, as the side column's "More help" links.
async function getHelpLinks(locale: string): Promise<HelpLink[]> {
  const response = await HelpService.getHelpItems()
  return (response?.data?.issue_types ?? [])
    .map((item) => item.help_issues_types_id)
    .filter((type) => type?.name && type.status === 'published' && (type.redirect || type.slug))
    .map((type) => ({
      name: type.name,
      href: type.redirect || localizedHref(locale, `/help/${type.slug}`),
    }))
}

// Every published guide in Directus is listed (no separate list to keep up to date), grouped by the
// category the editor picks on each guide. Rendered on the server; search and chips run in the page.
export default async function AppActivationGuidesPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { category } = await searchParams

  const [page, guides, helpLinks] = await Promise.all([
    HelpService.getActivationGuidesPage()
      .then((response) => response?.data ?? null)
      .catch((error): ActivationGuidesPageContent | null => {
        console.error('[ActivationGuidesPage] Failed to fetch the page texts:', error)
        return null
      }),
    HelpService.getAllActivationGuides().then((response) => response?.data ?? []),
    getHelpLinks(locale).catch((error): HelpLink[] => {
      console.error('[ActivationGuidesPage] Failed to fetch Help Centre links:', error)
      return []
    }),
  ])

  let labels = activationGuidesLabels(page)
  let content: GuideSummary[] = guides
  if (locale.toUpperCase() !== 'EN') {
    try {
      ;({ labels, guides: content } = await translateActivationGuidesList(labels, guides, locale))
    } catch (error) {
      // The English text is better than no page.
      console.error('[ActivationGuidesPage] Translation failed:', error)
    }
  }

  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: 'activation-guides',
    name: 'Activation Guides | Increddy',
    description: 'Learn how to activate your digital products.',
    type: 'CollectionPage',
    breadcrumbs: [{ name: 'Activation guides' }],
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <ActivationGuidesPage
        locale={locale}
        labels={labels}
        guides={content}
        helpLinks={helpLinks}
        initialCategory={typeof category === 'string' ? category : undefined}
      />
    </>
  )
}
