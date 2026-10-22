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
import { getDiscountPercent } from '@/lib/utils/discount'
import { isListItemBuyable } from '@/lib/utils/list-item-stock'
import { isInStock, maxQuantity, useCartStock } from '@/hooks/useCartStock'

const RECOMMENDATION_PLACEHOLDER_IMAGE =
  'https://placehold.co/205x262/png?text=No+Image'

// Keeps the cart page's recommendations a short, glanceable strip rather than a long list.
const MAX_RECOMMENDATIONS = 5

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
    return getDiscountPercent(compareAtPrice, price)
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
  const { stock, soldOutCount } = useCartStock(cart?.items)

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
        badges: item.tags,
        originalPrice,
        availableForSale: isInStock(stock, item.variantId),
        maxQuantity: maxQuantity(stock, item.variantId),
        platformInfo: item.platform,
      }
    })
  }, [cart, stock])

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
  const savings = items.reduce(
    (sum, item) =>
      sum + (item.originalPrice ? (item.originalPrice - item.price) * (item.quantity || 1) : 0),
    0,
  )

  const recommendationItems = React.useMemo(() => {
    // Sold-out products aren't suggested.
    return recommendations
      .filter(isListItemBuyable)
      .slice(0, MAX_RECOMMENDATIONS)
      .map((rec: any) => {
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

  // Suggestions already in the cart are hidden. While one is being added the list is held still:
  // adding can change the cart's first item, which reloads the suggestions and would otherwise
  // replace the row before its tick shows.
  const [heldRecommendations, setHeldRecommendations] = React.useState<typeof recommendationItems | null>(null)
  const cartHandles = React.useMemo(() => new Set(items.map((item) => item.handle)), [items])
  const shownRecommendations =
    heldRecommendations ?? recommendationItems.filter((rec) => !cartHandles.has(rec.handle))

  const handleAddToCart = async (product: any): Promise<boolean> => {
    if (!product.merchandiseId) {
      if (product.handle) {
        router.push(`/${product.handle}`)
        return false
      }
      toast.error('This item is unavailable to add right now.')
      return false
    }
    setHeldRecommendations(shownRecommendations)
    const addedBefore = useCartStore.getState().itemsAdded
    // No Added-to-cart popup: the item appears in the list above.
    await addItem(product.merchandiseId, 1, { notify: false })
    const added = useCartStore.getState().itemsAdded > addedBefore
    window.setTimeout(() => setHeldRecommendations(null), added ? 1700 : 0)
    return added
  }

  const handleCheckout = () => ensureCheckoutAllowed()
  const openCheckout = () => router.push('/checkout')

  const recommendationsBlock = (
    <div className="flex flex-col gap-4">
      <h2 data-display className="text-xl leading-6 font-bold text-white/95 md:text-2xl md:leading-[30px]">
        Recommended for You
      </h2>
      {isRecommendationsLoading && shownRecommendations.length === 0 ? (
        <div className="bg-card border-border divide-border divide-y rounded-2xl border">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`recommendation-skeleton-${index}`} className="flex animate-pulse items-center gap-3.5 px-4 py-3">
              <div className="aspect-[3/4] w-12 shrink-0 rounded-lg bg-white/10" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-3 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-1/3 rounded bg-white/10" />
              </div>
              <div className="h-9.5 w-19 rounded-[10px] bg-white/10" />
            </div>
          ))}
        </div>
      ) : shownRecommendations.length > 0 ? (
        <div className="bg-card border-border divide-border divide-y rounded-2xl border">
          {shownRecommendations.map((rec) => (
            <CartPageRecommendationRow key={rec.id} product={rec} onAddToCart={handleAddToCart} />
          ))}
        </div>
      ) : (
        <p className="py-4 text-sm text-white/65">No recommendations available right now.</p>
      )}
    </div>
  )

  return (
    <div className="bg-background min-h-screen pb-20 font-sans">
      <CartNavbar currentStep={1} itemCount={itemCount} />

      {/* Main Content Layout - account for fixed navbar */}
      <main className="mx-auto max-w-310 px-3 pt-8 sm:px-5 md:pt-16 lg:px-8">
        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Cart Items & Recommendations */}
          <div className={itemCount > 0 ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <h1 data-display className="mb-4 text-2xl leading-[30px] font-bold text-white/95 md:text-3xl md:leading-[38px]">
              My Cart
            </h1>
            <div>
              {isLoading && items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="border-muted-foreground h-8 w-8 animate-spin rounded-full border-2 border-t-white" />
                  <p className="text-white/65 text-sm">
                    Loading your cart...
                  </p>
                </div>
              ) : items.length > 0 ? (
                <div className="bg-card border-border divide-border divide-y rounded-2xl border">
                {items.map((item) => (
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
                ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="bg-secondary text-white/65 flex h-14 w-14 items-center justify-center rounded-full">
                    <ShoppingCart className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white/95">
                      Your cart is empty
                    </h3>
                    <p className="text-white/65 text-sm">
                      Looks like you haven&apos;t added any games yet.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {items.length > 0 && <div className="mt-12 hidden lg:block">{recommendationsBlock}</div>}
          </div>

          {/* Right Column: Order Summary */}
          {itemCount > 0 && (
            <div className="relative lg:col-span-4">
              <OrderSummary
                subtotal={basePrice}
                savings={savings}
                total={subtotal}
                itemCount={itemCount}
                currency={summaryCurrency}
                onCheckout={handleCheckout}
                onNavigate={openCheckout}
                blockedReason={soldOutCount > 0 ? 'Remove sold-out items to continue.' : undefined}
              />
            </div>
          )}

          {/* Recommendations after the summary on phones and tablets */}
          {items.length > 0 && <div className="mt-4 lg:hidden">{recommendationsBlock}</div>}
        </div>
      </main>
    </div>
  )
}
