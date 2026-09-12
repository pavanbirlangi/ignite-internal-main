import type { ProductListItem } from '@/types/product'
import { formatPrice } from '@/lib/currency'

export function buildHighlightRegex(match: string) {
  return new RegExp(`(${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
}

export function getProductPrice(product: ProductListItem): {
  current: string | null
  original: string | null
} {
  const current = product.priceRange?.minVariantPrice
  const original = product.compareAtPriceRange?.minVariantPrice

  const formatCurrency = (amount: string, currencyCode: string) => {
    return formatPrice(amount, currencyCode) || null
  }

  return {
    current: current?.amount
      ? formatCurrency(current.amount, current.currencyCode)
      : typeof product.price === 'object' && product.price?.amount
        ? formatCurrency(product.price.amount, product.price.currencyCode)
        : ((product.price as unknown as string) ?? null),
    original:
      original?.amount && Number(original.amount) > 0
        ? formatCurrency(original.amount, original.currencyCode)
        : typeof product.compareAtPrice === 'object' &&
            product.compareAtPrice?.amount &&
            Number(product.compareAtPrice.amount) > 0
          ? formatCurrency(
              product.compareAtPrice.amount,
              product.compareAtPrice.currencyCode,
            )
          : null,
  }
}

export function getProductImage(product: ProductListItem) {
  return product.featuredImage?.url || product.image || ''
}

export function buildProductRoute(
  product: Pick<ProductListItem, 'handle' | 'id'>,
) {
  return `/${product.handle || product.id}`
}

export function buildStoreSearchRoute(query: string) {
  const normalizedQuery = query.trim()

  if (!normalizedQuery) {
    return '/store'
  }

  return `/store?q=${encodeURIComponent(normalizedQuery)}`
}
