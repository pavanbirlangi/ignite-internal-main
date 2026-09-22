'use client'

import * as React from 'react'
import { ShoppingCart } from 'lucide-react'
import { CartNavbar } from '@/components/cart/CartNavbar'
import { CartItemRow } from '@/components/cart/CartItemRow'
import { OrderSummary } from '@/components/cart/OrderSummary'
import { CartPageRecommendationRow } from '@/components/cart/CartPageRecommendationRow'
import { useCartStore } from '@/store/useCartStore'
import { ensureCheckoutAllowed } from '@/lib/utils/checkout-guard'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const RECOMMENDATION_PLACEHOLDER_IMAGE =
  'https://placehold.co/205x262/png?text=No+Image'

const parseAmount = (amount?: string | number): number => {
  if (typeof amount === 'number') return amount
  if (typeof amount !== 'string') return 0
  const parsed = Number.parseFloat(amount)
  return Number.isFinite(parsed) ? parsed : 0
}

const getRecommendationMerchandiseId = (
  variants: unknown,
): string | undefined => {
  if (!variants) return undefined
  if (Array.isArray(variants)) {
    const firstAvailable = variants.find(
      (variant) =>
        variant &&
        typeof variant === 'object' &&
        (variant as any).availableForSale !== false,
    )
    const candidate = (firstAvailable || variants[0]) as any
    return typeof candidate?.id === 'string' ? candidate.id : undefined
  }
  if (typeof variants === 'object' && Array.isArray((variants as any).edges)) {
    const edges = (variants as any).edges
    const firstAvailableEdge = edges.find(
      (edge: any) => edge?.node?.availableForSale !== false,
    )
    const node = firstAvailableEdge?.node || edges[0]?.node
    return typeof node?.id === 'string' ? node.id : undefined
  }
  return undefined
}

const getDiscountPercentage = (
  discount: unknown,
  compareAtPrice: number,
  price: number,
): number | undefined => {
  if (discount && typeof discount === 'object') {
    const percentage = (discount as any).percentage
    if (typeof percentage === 'number' && Number.isFinite(percentage)) {
      return Math.round(percentage)
    }
  }
  if (compareAtPrice > price && price > 0) {
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
  }
  return undefined
}

export function CartPageContent() {
  const {
    cart,
    isLoading,
    removeItem,
    initCart,
    updateItem,
    recommendations,
    isRecommendationsLoading,
    addItem,
  } = useCartStore()
  const router = useRouter()

  React.useEffect(() => {
    initCart()
  }, [initCart])

  const items = React.useMemo(() => {
    if (!cart?.items?.length) return []
    const cartCurrencyCode = cart.currencyCode
    return cart.items.map((item) => {
      const price = item.unitPrice
      const originalPrice =
        item.compareAtUnitPrice !== null && item.compareAtUnitPrice > price
          ? item.compareAtUnitPrice
          : undefined

      return {
        id: item.id,
        handle: item.handle,
        merchandiseId: item.variantId,
        title: item.title,
        platform: item.variantTitle || '',
        price,
        currencyCode: cartCurrencyCode,
        quantity: item.quantity,
        image:
          item.thumbnail ||
          'https://placehold.co/205x262/1a1a1a/555555?text=No+Image',
        badges: [],
        originalPrice,
        availableForSale: true,
      }
    })
  }, [cart])

  // No promotion module exists yet (confirmed live) -- "Your cart total"
  // deliberately shows the pre-tax subtotal, matching Base Price, rather
  // than the tax-inclusive total the backend also returns with no line item
  // to explain it. See MEDUSA_MIGRATION_BACKEND_REQUIREMENTS.md.
  const subtotal = cart?.subtotal ?? 0
  const basePrice = React.useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0)
  }, [items])
  const subtotalCurrencyCode = cart?.currencyCode
  const summaryCurrency =
    subtotalCurrencyCode || items[0]?.currencyCode || 'USD'
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0)

  const recommendationItems = React.useMemo(() => {
    return recommendations.map((rec: any) => {
      const price = parseAmount(rec?.price?.amount)
      const compareAtPrice = parseAmount(rec?.compareAtPrice?.amount)
      const image = rec?.featuredImage?.url || RECOMMENDATION_PLACEHOLDER_IMAGE
      const discountPercentage = getDiscountPercentage(
        rec?.discount,
        compareAtPrice,
        price,
      )

      return {
        id: rec?.id,
        handle: rec?.handle,
        merchandiseId: getRecommendationMerchandiseId(rec?.variants),
        title: rec?.title || 'Recommended Product',
        platform: Array.isArray(rec?.platform) ? rec.platform.join(' / ') : '',
        price,
        currencyCode: rec?.price?.currencyCode || subtotalCurrencyCode,
        originalPrice: compareAtPrice > price ? compareAtPrice : undefined,
        discountPercentage,
        image,
        availableForSale: rec?.availableForSale ?? true,
      }
    })
  }, [recommendations, subtotalCurrencyCode])

  // Handlers
  const handleUpdateQuantity = (id: string, newQty: number) => {
    if (newQty < 1) return
    updateItem(id, newQty)
  }

  const handleRemove = (id: string) => {
    removeItem([id])
  }

  const handleAddToCart = (product: any) => {
    if (!product.merchandiseId) {
      if (product.handle) {
        router.push(`/${product.handle}`)
        return
      }
      toast.error('This item is unavailable to add right now.')
      return
    }
    return addItem(product.merchandiseId, 1)
  }

  const handleCheckout = () => {
    if (!ensureCheckoutAllowed()) return

    router.push('/checkout')
  }

  return (
    <div className="bg-background min-h-screen pb-20 font-sans">
      <CartNavbar currentStep={1} itemCount={itemCount} />

      {/* Main Content Layout - account for fixed navbar */}
      <main className="mx-auto max-w-310 px-3 pt-8 sm:px-5 md:pt-16 lg:px-8">
        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Cart Items & Recommendations */}
          <div className={itemCount > 0 ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <h1 className="mb-5 text-lg font-semibold text-white md:text-xl">
              My Cart
            </h1>
            <div className="flex flex-col gap-4 sm:gap-4">
              {isLoading && items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="border-muted-foreground h-8 w-8 animate-spin rounded-full border-2 border-t-white" />
                  <p className="text-muted-foreground text-sm">
                    Loading your cart...
                  </p>
                </div>
              ) : items.length > 0 ? (
                items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    quantity={item.quantity || 1}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemove}
                    isItemLoading={useCartStore
                      .getState()
                      .loadingItems.includes(item.id)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="bg-secondary text-muted-foreground flex h-14 w-14 items-center justify-center rounded-full">
                    <ShoppingCart className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">
                      Your cart is empty
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Looks like you haven&apos;t added any games yet.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="mt-4 hidden flex-col gap-4 md:flex lg:col-span-8 lg:mt-16">
                <h2 className="text-lg font-semibold text-white md:text-xl">
                  Recommended for You
                </h2>
                <div className="flex flex-col gap-3">
                  {isRecommendationsLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={`recommendation-skeleton-${index}`}
                        className="bg-secondary/20 flex animate-pulse items-center gap-2 rounded-[12px] border border-transparent px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5"
                      >
                        <div className="h-16 w-12 shrink-0 rounded-md bg-white/10" />
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="h-3 w-3/4 rounded bg-white/10" />
                          <div className="h-3 w-1/2 rounded bg-white/10" />
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-white/10 sm:h-9 sm:w-9" />
                      </div>
                    ))
                  ) : recommendationItems.length > 0 ? (
                    recommendationItems.map((rec) => (
                      <CartPageRecommendationRow
                        key={rec.id}
                        product={rec}
                        onAddToCart={handleAddToCart}
                      />
                    ))
                  ) : (
                    <p className="text-muted-foreground py-4 text-sm">
                      No recommendations available right now.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          {itemCount > 0 && (
            <div className="relative lg:col-span-4">
              <OrderSummary
                basePrice={basePrice}
                total={subtotal}
                currency={summaryCurrency}
                onCheckout={handleCheckout}
              />
            </div>
          )}

          {/* Recommendations Section - After Order Summary on Mobile */}
          {items.length > 0 && (
            <div className="mt-4 flex flex-col gap-4 md:hidden lg:col-span-8 lg:mt-10">
              <h2 className="text-lg font-semibold text-white md:text-xl">
                Recommended for You
              </h2>
              <div className="flex flex-col gap-3">
                {isRecommendationsLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`recommendation-skeleton-${index}`}
                      className="bg-secondary/20 flex animate-pulse items-center gap-2 rounded-[12px] border border-transparent px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5"
                    >
                      <div className="h-16 w-12 shrink-0 rounded-md bg-white/10" />
                      <div className="flex flex-1 flex-col gap-2">
                        <div className="h-3 w-3/4 rounded bg-white/10" />
                        <div className="h-3 w-1/2 rounded bg-white/10" />
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-white/10 sm:h-9 sm:w-9" />
                    </div>
                  ))
                ) : recommendationItems.length > 0 ? (
                  recommendationItems.map((rec) => (
                    <CartPageRecommendationRow
                      key={rec.id}
                      product={rec}
                      onAddToCart={handleAddToCart}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground py-4 text-sm">
                    No recommendations available right now.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
