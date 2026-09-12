import type { ProductListItem } from '@/types/product'
import type { WishlistProduct } from '@/lib/services/wishlist.service'


export const mapWishlistProductToProduct = (
  wp: WishlistProduct,
): ProductListItem => {
  const firstVariant = wp.variants?.[0]
  const price = wp.price ?? firstVariant?.price
  const compareAtPrice = wp.compareAtPrice ?? firstVariant?.compareAtPrice

  return {
    id: wp.id,
    title: wp.title,
    handle: wp.handle,
    description: wp.description ?? '',
    productType: wp.productType,
    featuredImage: wp.featuredImage
      ? {
          url: wp.featuredImage.url,
          altText: wp.featuredImage.altText || wp.title,
        }
      : null,
    price: price ?? undefined,
    priceRange: wp.priceRange ??
      (price
        ? {
            minVariantPrice: {
              amount: price.amount,
              currencyCode: price.currencyCode,
            },
          }
        : undefined),
    compareAtPrice: compareAtPrice
      ? {
          amount: compareAtPrice.amount,
          currencyCode: compareAtPrice.currencyCode,
        }
      : undefined,
    compareAtPriceRange: wp.compareAtPriceRange ??
      (compareAtPrice && Number(compareAtPrice.amount) > 0
        ? {
            minVariantPrice: {
              amount: compareAtPrice.amount,
              currencyCode: compareAtPrice.currencyCode,
            },
          }
        : undefined),
    discount: wp.discount ?? firstVariant?.discount ?? undefined,
    tags: wp.tags,
    collections: wp.collections,
    instantDelivery: wp.instantDelivery,
    onSale: wp.onSale,
    featured: wp.featured,
    gameLogo: wp.gameLogo ?? undefined,
    platform: wp.platform,
    region: wp.region,
    edition: wp.edition,
    variants: wp.variants?.map((v) => ({
      id: v.id,
      title: v.title,
      availableForSale: v.availableForSale,
      selectedOptions: v.selectedOptions,
    })),
    variantOptions: wp.variantOptions,
  }
}
