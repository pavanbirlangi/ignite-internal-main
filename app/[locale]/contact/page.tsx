import { HelpService } from '@/lib/services/help.service'
import ContactPage from '@/components/contact/ContactPage'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import { translateContactData } from '@/lib/translations/contact'
import type { Metadata } from 'next'
import { cache } from 'react'
import { generateSeoMetadata, getWebPageJsonLd } from '@/lib/seo'

const getContactUsPageCached = cache(async () => {
  return HelpService.getContactUsPage()
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  let content: any = null
  try {
    const response = await getContactUsPageCached()
    content = response?.data
  } catch (error) {
    console.error('[ContactPage] Failed to fetch data for metadata:', error)
  }

  return generateSeoMetadata(
    content?.seo,
    locale,
    'contact',
    content?.heading || 'Contact Us | Increddy',
    content?.description || 'Need help? Get in touch with our support team.',
    translateTextsWithLangbly,
  )
}

export default async function AppContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: 'contact',
    name: 'Contact Us | Increddy',
    description: 'Need help? Get in touch with our support team.',
  })

  try {
    const response = await getContactUsPageCached()
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
          <ContactPage />
        </>
      )
    }

    const translatedContent =
      locale.toUpperCase() === 'EN'
        ? content
        : await translateContactData(content, locale)

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webPageJsonLd),
          }}
        />
        <ContactPage translatedContent={translatedContent} />
      </>
    )
  } catch (error) {
    console.error('[ContactPage] Failed to fetch/translate content:', error)
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webPageJsonLd),
          }}
        />
        <ContactPage />
      </>
    )
  }
}
