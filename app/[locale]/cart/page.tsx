import { CartPageContent } from '@/components/cart/CartPageContent'
import type { Metadata } from 'next'
import { generateSeoMetadata, getWebPageJsonLd } from '@/lib/seo'
import { FaqService, type FaqItem } from '@/lib/services/faq.service'
import { translateFaqItems } from '@/lib/translations/faq'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  return generateSeoMetadata(
    null,
    locale,
    'cart',
    'My Cart | Increddy',
    'Review and checkout your digital keys.',
  )
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: 'cart',
    name: 'My Cart | Increddy',
    description: 'Review and checkout your digital keys.',
  })

  let faqItems: FaqItem[] = []
  try {
    faqItems = await FaqService.getByCategory('cart')
    if (faqItems.length > 0 && locale.toUpperCase() !== 'EN') {
      faqItems = await translateFaqItems(faqItems, locale)
    }
  } catch (error) {
    console.error('[CartPage] Failed to fetch FAQ data:', error)
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd),
        }}
      />
      <CartPageContent faqItems={faqItems} />
    </>
  )
}
