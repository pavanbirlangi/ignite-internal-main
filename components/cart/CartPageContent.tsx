'use client'

import * as React from 'react'
import { ShoppingCart } from 'lucide-react'
import { CartNavbar } from '@/components/cart/CartNavbar'
import { CartItemRow } from '@/components/cart/CartItemRow'
import { OrderSummary } from '@/components/cart/OrderSummary'
import StoreCard from '@/components/store/StoreCard'
import { useCartStore } from '@/store/useCartStore'
import { ensureCheckoutAllowed } from '@/lib/utils/checkout-guard'
import { useRouter } from 'next/navigation'

// Keeps the cart page's recommendations a small, glanceable strip rather than a long list --
// the store grid/carousel is where browsing the full catalog belongs.
const MAX_RECOMMENDATIONS = 5

export function CartPageContent() {
  const {
    cart,
    isLoading,
    removeItem,
    initCart,
    updateItem,
    recommendations,
    isRecommendationsLoading,
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
  // deliberately shows the plain products subtotal, matching Base Price.
  // The service fee and tax are both only real/final once attached to a
  // cart at checkout, so neither one is baked into this page's total.
  // See MEDUSA_MIGRATION_BACKEND_REQUIREMENTS.md.
  const subtotal = cart?.subtotal ?? 0
  const basePrice = React.useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0)
  }, [items])
  const subtotalCurrencyCode = cart?.currencyCode
  const summaryCurrency =
    subtotalCurrencyCode || items[0]?.currencyCode || 'USD'
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0)

  const recommendationItems = React.useMemo(
    () => recommendations.slice(0, MAX_RECOMMENDATIONS),
    [recommendations],
  )

  // Handlers
  const handleUpdateQuantity = (id: string, newQty: number) => {
    if (newQty < 1) return
    updateItem(id, newQty)
  }

  const handleRemove = (id: string) => {
    removeItem([id])
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
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {isRecommendationsLoading ? (
                    Array.from({ length: MAX_RECOMMENDATIONS }).map((_, index) => (
                      <div
                        key={`recommendation-skeleton-${index}`}
                        className="bg-secondary/20 aspect-[1/1.7] animate-pulse rounded-2xl"
                      />
                    ))
                  ) : recommendationItems.length > 0 ? (
                    recommendationItems.map((rec) => (
                      <StoreCard key={rec.id} product={rec} />
                    ))
                  ) : (
                    <p className="text-muted-foreground col-span-full py-4 text-sm">
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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {isRecommendationsLoading ? (
                  Array.from({ length: MAX_RECOMMENDATIONS }).map((_, index) => (
                    <div
                      key={`recommendation-skeleton-${index}`}
                      className="bg-secondary/20 aspect-[1/1.7] animate-pulse rounded-2xl"
                    />
                  ))
                ) : recommendationItems.length > 0 ? (
                  recommendationItems.map((rec) => (
                    <StoreCard key={rec.id} product={rec} />
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-full py-4 text-sm">
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
