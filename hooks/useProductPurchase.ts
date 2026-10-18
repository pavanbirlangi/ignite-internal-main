'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/useCartStore'
import { formatPrice } from '@/lib/currency'
import type { Product, ProductVariant } from '@/types/product'

export type AddState = 'idle' | 'loading' | 'done'

// Buy now / Add to cart for the product page. The buy panel and the sliding buy bar both use
// it, so they always agree on price, stock and what happens on click.
export function useProductPurchase(product: Product) {
  const addItem = useCartStore((state) => state.addItem)
  const router = useRouter()
  const [isOpening, startOpening] = useTransition()
  const [addState, setAddState] = useState<AddState>('idle')

  const variant: ProductVariant | undefined = useMemo(() => {
    const variants = Array.isArray(product.variants)
      ? product.variants
      : product.variants.edges.map((edge) => edge.node)
    return variants.find((v) => v.availableForSale) ?? variants[0]
  }, [product.variants])

  const isPriced = variant?.priced !== false
  const canBuy = Boolean(variant?.availableForSale) && isPriced

  const price = variant && isPriced ? formatPrice(variant.price.amount, variant.price.currencyCode) : null
  const compareAtPrice =
    variant?.compareAtPrice && isPriced
      ? formatPrice(variant.compareAtPrice.amount, variant.compareAtPrice.currencyCode)
      : null
  const discountPercent = isPriced ? (variant?.discount?.percentage ?? null) : null

  // addItem reports failures itself (toast) and resolves either way, so success is read
  // from the store's add counter.
  const addToCart = async () => {
    if (!variant || !canBuy || addState !== 'idle') return
    setAddState('loading')
    const before = useCartStore.getState().itemsAdded
    await Promise.all([addItem(variant.id, 1), new Promise((resolve) => setTimeout(resolve, 450))])
    if (useCartStore.getState().itemsAdded === before) {
      setAddState('idle')
      return
    }
    setAddState('done')
    window.setTimeout(() => setAddState('idle'), 1600)
  }

  const buyNow = () => {
    if (!variant || !canBuy) return
    startOpening(async () => {
      const before = useCartStore.getState().itemsAdded
      await addItem(variant.id, 1)
      if (useCartStore.getState().itemsAdded !== before) router.push('/cart')
    })
  }

  return { variant, isPriced, canBuy, price, compareAtPrice, discountPercent, addState, addToCart, buyNow, isOpening }
}
