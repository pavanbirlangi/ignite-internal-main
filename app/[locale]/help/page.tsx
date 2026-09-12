import HelpPage from '@/components/help/HelpPage'
import { HelpService } from '@/lib/services/help.service'
import type { HelpDataResponse } from '@/lib/services/help.service'
import type { Metadata } from 'next'
import { generateSeoMetadata, getWebPageJsonLd } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  let content: HelpDataResponse['data'] | null = null
  try {
    const response = await HelpService.getHelpItems()
    content = response?.data
  } catch (error) {
    console.error('[HelpPage] Failed to fetch data for metadata:', error)
  }

  return generateSeoMetadata(
    content?.seo,
    locale,
    'help',
    content?.title || 'Help Center | Increddy',
    content?.description ||
      'Find answers to your questions in our Help Center.',
  )
}

export default async function HelpPageRoute({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: 'help',
    name: 'Help Center | Increddy',
    description: 'Find answers to your questions in our Help Center.',
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd),
        }}
      />
      <HelpPage />
    </>
  )
}
