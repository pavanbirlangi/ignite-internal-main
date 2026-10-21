'use client'

import { useQuery } from '@tanstack/react-query'
import { ProductService } from '@/lib/services/product.service'

type StockLine = { productId: string; variantId: string }

// Whether each cart line can still be bought (a key or backorders left, and a price), checked
// with one batch call and again when the cart changes or the tab regains focus. A line it
// couldn't check counts as buyable; the backend still refuses a sold-out line at checkout.
export function useCartStock(items: StockLine[] | undefined) {
  const productIds = [...new Set((items ?? []).map((item) => item.productId).filter(Boolean))].sort()
  const { data } = useQuery({
    queryKey: ['cart-stock', productIds],
    queryFn: () => ProductService.getVariantStock(productIds),
    enabled: productIds.length > 0,
    staleTime: 30_000,
  })
  const soldOutCount = (items ?? []).filter((item) => !isInStock(data, item.variantId)).length
  return { stock: data, soldOutCount }
}

export const isInStock = (stock: Record<string, boolean> | undefined, variantId: string) =>
  stock?.[variantId] !== false
