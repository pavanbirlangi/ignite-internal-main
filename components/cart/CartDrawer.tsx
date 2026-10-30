import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { CartProduct } from './types'
import { CartDrawerItem } from './CartDrawerItem'
import { RecommendationRow } from './RecommendationRow'
import { CartFooter } from './CartFooter'
import CartSolidIcon from '../icons/CartSolidIcon'
import { headerIconButtonClass } from '../layout/navbar/header-icon-button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import { useCartStore } from '@/store/useCartStore'
import { isInStock, useCartStock } from '@/hooks/useCartStock'
import { getDiscountPercent } from '@/lib/utils/discount'
import { isListItemBuyable } from '@/lib/utils/list-item-stock'
import { setCartDrawerOpen } from '@/components/cart/AddedToCartToast'
import { isCartFlightPending } from '@/lib/fly-to-cart'

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
    return getDiscountPercent(compareAtPrice, price)
  }

  return undefined
}

// A short list under the cart items, like the cart page.
const MAX_RECOMMENDATIONS = 5

export function CartDrawer() {
  const [open, setOpen] = React.useState(false)

  // Keeps the add-to-cart popup away while the drawer is open (see setCartDrawerOpen).
  React.useEffect(() => {
    setCartDrawerOpen(open)
    return () => setCartDrawerOpen(false)
  }, [open])
  const router = useRouter()
  const {
    cart,
    recommendations,
    isLoading,
    itemsAdded,
    isRecommendationsLoading,
    loadRecommendations,
    removeItem,
    initCart,
    updateItem,
    addItem,
  } = useCartStore()

  const { stock, soldOutCount } = useCartStock(cart?.items)

  React.useEffect(() => {
    initCart()
  }, [initCart])

  // Recommendations aren't loaded while paying (see maybeRefreshRecommendations): fetched when the
  // drawer is opened there.
  const hasItems = Boolean(cart?.items.length)
  React.useEffect(() => {
    if (open && hasItems && recommendations.length === 0 && !isRecommendationsLoading) {
      void loadRecommendations()
    }
    // Only on opening; an empty result isn't retried while it stays open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasItems])

  // Adds from a product card fly the cover here and hop the cart when it
  // lands (lib/fly-to-cart), so those skip the instant hop below.
  const hopOnAdd = React.useMemo(
    () => !isCartFlightPending(),
    // Re-checked once per add, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemsAdded],
  )

  const cartItems = React.useMemo(() => {
    if (!cart?.items?.length) return []
    const cartCurrencyCode = cart.currencyCode
    return cart.items.map((item) => {
      const price = item.unitPrice
      const originalPrice =
        item.compareAtUnitPrice !== null && item.compareAtUnitPrice > price
          ? item.compareAtUnitPrice
          : undefined
      const discountPercentage =
        originalPrice && originalPrice > price
          ? getDiscountPercent(originalPrice, price)
          : undefined

      return {
        id: item.id,
        handle: item.handle,
        merchandiseId: item.variantId,
        title: item.title,
        platform: item.variantTitle || '',
        price,
        currencyCode: cartCurrencyCode,
        originalPrice,
        discountPercentage,
        quantity: item.quantity,
        image:
          item.thumbnail ||
          'https://placehold.co/64x80/1a1a1a/555555?text=No+Image',
        availableForSale: isInStock(stock, item.variantId),
      }
    })
  }, [cart, stock])

  // The footer's "Cart Total" is the products only, like the cart page: the
  // service fee and tax are shown and charged at checkout, not in the cart.
  const itemsSubtotal = React.useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems],
  )
  const subtotalCurrencyCode = cart?.currencyCode
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  // Suggestions just added stay on screen briefly so their tick is seen,
  // even if the list refreshes meanwhile (adding can change the seed product).
  const [justAdded, setJustAdded] = React.useState<CartProduct[]>([])

  const recommendationItems = React.useMemo<CartProduct[]>(() => {
    // Products already in the cart aren't suggested again.
    const inCart = new Set(cart?.items?.map((item) => item.handle) ?? [])
    const held = new Set(justAdded.map((product) => product.id))
    const items: CartProduct[] = recommendations
      // Sold-out products aren't suggested; ones in the cart only while their tick shows.
      .filter(isListItemBuyable)
      .filter((rec) => !inCart.has(rec.handle) || held.has(rec.id))
      .map((rec: any): CartProduct => {
        const price = parseAmount(rec?.price?.amount)
        const compareAtPrice = parseAmount(rec?.compareAtPrice?.amount)
        const image =
          rec?.featuredImage?.url || RECOMMENDATION_PLACEHOLDER_IMAGE
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
          platform: Array.isArray(rec?.platform)
            ? rec.platform.join(' / ')
            : '',
          price,
          currencyCode: rec?.price?.currencyCode || subtotalCurrencyCode,
          originalPrice: compareAtPrice > price ? compareAtPrice : undefined,
          discountPercentage,
          image,
          availableForSale: rec?.availableForSale ?? true,
        }
      })
    const missing = justAdded.filter(
      (product) => !items.some((item) => item.id === product.id),
    )
    return [...missing, ...items].slice(0, MAX_RECOMMENDATIONS)
  }, [recommendations, subtotalCurrencyCode, cart, justAdded])

  const handleRemove = (id: string) => {
    removeItem([id])
  }

  const handleUpdateQuantity = (id: string, qty: number) => {
    if (qty < 1) return
    updateItem(id, qty)
  }

  const handleAddToCart = async (product: CartProduct) => {
    if (!product.merchandiseId) {
      if (product.handle) {
        setOpen(false)
        router.push(`/${product.handle}`)
        return false
      }

      toast.error('This item is unavailable to add right now.')
      return false
    }

    // Held before adding: the cart updates before addItem returns, and the
    // row would otherwise be filtered out (and lose its state) in between.
    setJustAdded((held) => [...held, product])
    const release = () =>
      setJustAdded((held) => held.filter((item) => item.id !== product.id))

    const addedBefore = useCartStore.getState().itemsAdded
    // No Added-to-cart popup here: the item shows up in the list above.
    await addItem(product.merchandiseId, 1, { notify: false })
    const added = useCartStore.getState().itemsAdded > addedBefore
    if (added) window.setTimeout(release, 1600)
    else release()
    return added
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open cart"
          aria-busy={isLoading || undefined}
          className={headerIconButtonClass}
        >
          {/* Hops each time an item is added (keyed on the store's add counter, so not on load). */}
          <span
            // Prefixed: a bare number would clash with the count badge's key below
            // whenever both happen to be equal.
            key={`hop-${itemsAdded}`}
            data-cart-target
            className={cn(
              'flex',
              itemsAdded > 0 &&
                hopOnAdd &&
                'animate-cart-bump motion-reduce:animate-none',
            )}
          >
            <CartSolidIcon />
          </span>
          {/* Spinning ring while the cart is being updated */}
          {isLoading && (
            <span
              aria-hidden
              className="border-t-primary pointer-events-none absolute -inset-px animate-spin rounded-full border-2 border-transparent motion-reduce:animate-none"
            />
          )}
          {cartCount > 0 && (
            <span
              key={`count-${cartCount}`}
              className="bg-primary text-primary-foreground animate-in zoom-in-50 absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold shadow-[0_0_0_2px_var(--background)] duration-300 motion-reduce:animate-none"
            >
              {cartCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        className="bg-card border-border my-auto flex w-full flex-col overflow-hidden rounded-2xl border p-0 text-white/95 focus:outline-none focus-visible:outline-none sm:mr-4 sm:max-h-[95vh] sm:max-w-110"
        showCloseButton={false}
      >
        {/* Header */}
        <SheetHeader className="border-border flex shrink-0 flex-row items-center justify-between space-y-0 border-b px-6 py-5 text-left">
          <SheetTitle className="flex items-baseline gap-2 font-sans text-xl font-bold text-white/95">
            Cart{' '}
            <span className="text-sm font-medium text-white/65">
              ({cartCount} item{cartCount !== 1 ? 's' : ''})
            </span>
          </SheetTitle>
          {/* Same close button as the modals. */}
          <SheetClose
            aria-label="Close cart"
            className="group/close grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-white/5 transition-colors outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <X
              className="size-[18px] text-white/65 transition-colors group-hover/close:text-white"
              strokeWidth={2}
            />
          </SheetClose>
        </SheetHeader>

        {/* Scrollable Content: ends at the footer below it, so it only scrolls when items overflow */}
        <div className="scrollbar-hide no-scrollbar flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-6">
          {/* Cart Items List */}
          <div className="flex flex-col">
            {isLoading && cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="border-muted-foreground h-8 w-8 animate-spin rounded-full border-2 border-t-white" />
                <p className="text-sm text-white/65">Loading your cart...</p>
              </div>
            ) : cartItems.length > 0 ? (
              cartItems.map((item) => (
                <CartDrawerItem
                  key={item.id}
                  product={item}
                  onRemove={handleRemove}
                  onUpdateQuantity={handleUpdateQuantity}
                  isItemLoading={useCartStore
                    .getState()
                    .loadingItems.includes(item.id)}
                  onNavigate={() => setOpen(false)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="bg-secondary flex h-16 w-16 items-center justify-center rounded-full text-white/65">
                  <ShoppingCart className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white/95">
                    Your cart is empty
                  </h3>
                  <p className="text-sm text-white/65">
                    Looks like you haven't added any games yet.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {cartItems.length > 0 &&
            (isRecommendationsLoading || recommendationItems.length > 0) && (
              <div className="flex flex-col gap-4">
                <h3 className="font-sans text-base font-bold text-white/95">
                  You might also like
                </h3>
                <div className="flex flex-col gap-1">
                  {/* Keep showing the current suggestions while a refresh
                      loads; the placeholder is only for the first load. */}
                  {isRecommendationsLoading &&
                  recommendationItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                      <div className="border-muted-foreground h-7 w-7 animate-spin rounded-full border-2 border-t-white" />
                      <p className="text-sm text-white/65">
                        Loading recommendations...
                      </p>
                    </div>
                  ) : recommendationItems.length > 0 ? (
                    recommendationItems.map((rec) => (
                      <RecommendationRow
                        key={rec.id}
                        product={rec}
                        onAddToCart={handleAddToCart}
                        onNavigate={() => setOpen(false)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-white/65">
                      No recommendations available right now.
                    </p>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Fixed Footer */}
        {cartCount > 0 && (
          <CartFooter
            total={itemsSubtotal}
            count={cartCount}
            currencyCode={subtotalCurrencyCode}
            blockedReason={soldOutCount > 0 ? 'Remove sold-out items to continue.' : undefined}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
