import { CartPageContent } from '@/components/cart/CartPageContent'
import type { Metadata } from 'next'
import { generateSeoMetadata, getWebPageJsonLd } from '@/lib/seo'
import { ProductService } from '@/lib/services/product.service'
import type { ProductListItem } from '@/types/product'

// The home page's curated deals, shown when the cart is empty.
const EMPTY_CART_COLLECTION = 'featured-deals'

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
  const featuredDeals = await ProductService.getCollectionProductsByHandle(EMPTY_CART_COLLECTION).catch(
    () => [] as ProductListItem[],
  )
  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: 'cart',
    name: 'My Cart | Increddy',
    description: 'Review and checkout your digital keys.',
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd),
        }}
      />
      <CartPageContent featuredDeals={featuredDeals} />
    </>
  )
}
