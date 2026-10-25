import NotFoundContent from '@/components/shared/NotFoundContent'
import { ProductService } from '@/lib/services/product.service'
import type { ProductListItem } from '@/types/product'

// Same collection the empty cart shows (app/[locale]/cart/page.tsx).
const NOT_FOUND_COLLECTION = 'featured-deals'

export default async function NotFound() {
  const featuredDeals = await ProductService.getCollectionProductsByHandle(NOT_FOUND_COLLECTION).catch(
    () => [] as ProductListItem[],
  )
  return <NotFoundContent featuredDeals={featuredDeals} />
}
