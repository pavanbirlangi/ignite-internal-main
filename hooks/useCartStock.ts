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

type Stock = Record<string, { purchasable: boolean; limit: number | null }> | undefined

// A sensible ceiling for one line when stock doesn't set one (backorders on, or unknown).
export const MAX_LINE_QUANTITY = 99

export const isInStock = (stock: Stock, variantId: string) => stock?.[variantId]?.purchasable !== false

export const maxQuantity = (stock: Stock, variantId: string) =>
  Math.max(1, Math.min(MAX_LINE_QUANTITY, stock?.[variantId]?.limit ?? MAX_LINE_QUANTITY))
