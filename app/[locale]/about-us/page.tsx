import { AboutService } from '@/lib/services/about.service'
import AboutPage from '@/components/about/AboutPage'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import { translateAboutData } from '@/lib/translations/about'
import type { Metadata } from 'next'
import { generateSeoMetadata, getWebPageJsonLd } from '@/lib/seo'
import type { AboutUsResponse } from '@/lib/services/about.service'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  let content: AboutUsResponse['data'] | null = null
  try {
    const response = await AboutService.getAboutUsPage()
    content = response?.data
  } catch (error) {
    console.error('[AboutPage] Failed to fetch data for metadata:', error)
  }

  return generateSeoMetadata(
    content?.seo,
    locale,
    'about-us',
    content?.title || 'About Us | Increddy',
    content?.description || 'Learn more about Increddy.',
    translateTextsWithLangbly,
  )
}

export default async function AppAboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: 'about-us',
    name: 'About Us | Increddy',
    description: 'Learn more about Increddy.',
  })

  try {
    const response = await AboutService.getAboutUsPage()
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
          <AboutPage />
        </>
      )
    }

    // Translate content if locale is not English
    const translatedContent =
      locale.toUpperCase() === 'EN'
        ? content
        : await translateAboutData(content, locale)

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webPageJsonLd),
          }}
        />
        <AboutPage translatedContent={translatedContent} />
      </>
    )
  } catch (error) {
    console.error('[AboutPage] Failed to fetch/translate content:', error)
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webPageJsonLd),
          }}
        />
        <AboutPage />
      </>
    )
  }
}
