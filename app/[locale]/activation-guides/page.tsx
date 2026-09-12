import { HelpService } from '@/lib/services/help.service'
import ActivationGuidesPage from '@/components/help/activation-guides/ActivationGuidesPage'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import { translateActivationGuidesData } from '@/lib/translations/activation-guides'
import type { Metadata } from 'next'
import { generateSeoMetadata, getWebPageJsonLd } from '@/lib/seo'
import type { ActivationGuidesResponse } from '@/lib/services/help.service'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  let content: ActivationGuidesResponse['data'] | null = null
  try {
    const response = await HelpService.getActivationGuides()
    content = response?.data
  } catch (error) {
    console.error(
      '[ActivationGuidesPage] Failed to fetch data for metadata:',
      error,
    )
  }

  return generateSeoMetadata(
    content?.seo,
    locale,
    'activation-guides',
    content?.page_title || 'Activation Guides | Increddy',
    'Learn how to activate your digital products.',
    translateTextsWithLangbly,
  )
}

export default async function AppActivationGuidesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: 'activation-guides',
    name: 'Activation Guides | Increddy',
    description: 'Learn how to activate your digital products.',
  })

  try {
    const response = await HelpService.getActivationGuides()
    const content = response?.data

    if (!content) {
      return (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(webPageJsonLd),
            }}
          />
          <ActivationGuidesPage />
        </>
      )
    }

    const translatedContent =
      locale.toUpperCase() === 'EN'
        ? content
        : await translateActivationGuidesData(content, locale)

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webPageJsonLd),
          }}
        />
        <ActivationGuidesPage translatedContent={translatedContent} />
      </>
    )
  } catch (error) {
    console.error(
      '[ActivationGuidesPage] Failed to fetch/translate content:',
      error,
    )
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webPageJsonLd),
          }}
        />
        <ActivationGuidesPage />
      </>
    )
  }
}
