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
import CartIcon from '../icons/CartIcon'
import { toast } from 'sonner'

import { useCartStore } from '@/store/useCartStore'

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

export function CartDrawer() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const {
    cart,
    recommendations,
    isLoading,
    isRecommendationsLoading,
    removeItem,
    initCart,
    updateItem,
    addItem,
  } = useCartStore()

  React.useEffect(() => {
    initCart()
  }, [initCart])

  const cartItems = React.useMemo(() => {
    if (!cart?.lines?.edges) return []
    const cartCurrencyCode = cart?.cost?.totalAmount?.currencyCode
    return cart.lines.edges.map((edge: any) => {
      const node = edge.node
      const merchandise = node?.merchandise || {}
      const product = merchandise?.product || {}
      const shopifyDiscount = node?.shopifyDiscount
      const hasShopifyDiscount = shopifyDiscount?.hasDiscount === true

      const merchandisePrice = parseAmount(merchandise?.price?.amount)
      const compareAtPrice = parseAmount(merchandise?.compareAtPrice?.amount)

      const price =
        hasShopifyDiscount && node?.cost?.unitAmount?.amount
          ? parseAmount(node.cost.unitAmount.amount)
          : merchandisePrice

      const originalPriceAmount = compareAtPrice
      const originalPrice =
        originalPriceAmount > price ? originalPriceAmount : undefined

      const combinedDiscountPercentage =
        originalPrice && originalPrice > price
          ? Math.round(((originalPrice - price) / originalPrice) * 100)
          : undefined

      const shopifyDiscountBreakdowns =
        hasShopifyDiscount && shopifyDiscount?.breakdowns
          ? shopifyDiscount.breakdowns.map((b: any) => ({
              title: b.title,
              amount: parseAmount(b.discountedAmount?.amount),
            }))
          : undefined

      // Resolve image: try every possible location the API may return it
      const image =
        merchandise?.image?.url ||
        merchandise?.image?.src ||
        product?.featuredImage?.url ||
        product?.featuredImage?.src ||
        product?.images?.edges?.[0]?.node?.url ||
        'https://placehold.co/64x80/1a1a1a/555555?text=No+Image'

      return {
        id: node?.id,
        handle: product?.handle,
        merchandiseId: merchandise?.id,
        title: product?.title || merchandise?.title || 'Unknown Product',
        platform: (merchandise?.title || '').replace(/\s*\/\s*/g, '/'),
        price,
        currencyCode: merchandise?.price?.currencyCode || cartCurrencyCode,
        originalPrice,
        discountPercentage: combinedDiscountPercentage,
        quantity: node?.quantity || 1,
        image,
        availableForSale: merchandise?.availableForSale ?? true,
        hasShopifyDiscount,
        shopifyDiscountBreakdowns,
      }
    })
  }, [cart])

  const subtotal = parseFloat(cart?.cost?.totalAmount?.amount || '0')
  const itemsSubtotal = React.useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems],
  )
  const subtotalCurrencyCode = cart?.cost?.totalAmount?.currencyCode
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  const recommendationItems = React.useMemo(() => {
    return recommendations.map((rec: any): CartProduct => {
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

  const handleRemove = (id: string) => {
    removeItem([id])
  }

  const handleUpdateQuantity = (id: string, qty: number) => {
    if (qty < 1) return
    updateItem(id, qty)
  }

  const handleAddToCart = (product: CartProduct) => {
    if (!product.merchandiseId) {
      if (product.handle) {
        setOpen(false)
        router.push(`/${product.handle}`)
        return
      }

      toast.error('This item is unavailable to add right now.')
      return
    }

    addItem(product.merchandiseId, 1)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open cart"
          className="relative flex size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/5 hover:text-white"
        >
          <CartIcon />
          {cartCount > 0 && (
            <span className="bg-primary text-primary-foreground absolute -top-1 -right-1.5 flex size-4.5 items-center justify-center rounded-full text-xs font-semibold">
              {cartCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        className="bg-secondary my-auto flex w-full flex-col overflow-hidden rounded-[12px] p-0 text-white focus:outline-none focus-visible:outline-none sm:mr-4 sm:max-h-[95vh] sm:max-w-110"
        showCloseButton={false}
      >
        {/* Header */}
        <SheetHeader className="borde-muted-foreground flex shrink-0 flex-row items-center justify-between space-y-0 border-b px-6 py-5 text-left">
          <SheetTitle className="flex items-baseline gap-2 font-sans text-xl font-semibold text-white md:text-2xl">
            Cart{' '}
            <span className="text-muted-foreground text-lg font-semibold">
              ({cartCount} item{cartCount !== 1 ? 's' : ''})
            </span>
          </SheetTitle>
          <SheetClose
            aria-label="Close cart"
            className="rounded-full p-2 transition-colors hover:bg-white/10"
          >
            <X className="text-muted-foreground h-6 w-6" />
          </SheetClose>
        </SheetHeader>

        {/* Scrollable Content */}
        <div
          className={`scrollbar-hide flex flex-1 flex-col gap-8 no-scrollbar overflow-y-auto p-6 ${
            cartCount > 0
              ? cart?.discountSummary?.hasDiscount &&
                cart.discountSummary.totalSavings?.amount &&
                parseFloat(cart.discountSummary.totalSavings.amount) > 0
                ? 'pb-72'
                : 'pb-64'
              : 'pb-6'
          }`}
        >
          {/* Cart Items List */}
          <div className="flex flex-col gap-4">
            {isLoading && cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="border-muted-foreground h-8 w-8 animate-spin rounded-full border-2 border-t-white" />
                <p className="text-muted-foreground text-sm">
                  Loading your cart...
                </p>
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
                <div className="bg-secondary text-muted-foreground flex h-16 w-16 items-center justify-center rounded-full">
                  <ShoppingCart className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">
                    Your cart is empty
                  </h3>
                  <p className="tex-muted-foreground text-sm">
                    Looks like you haven't added any games yet.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {cartItems.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-sans text-xl font-semibold text-white md:text-2xl">
                We Also Recommend
              </h3>
              <div className="flex flex-col gap-3">
                {isRecommendationsLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                    <div className="border-muted-foreground h-7 w-7 animate-spin rounded-full border-2 border-t-white" />
                    <p className="text-muted-foreground text-sm">
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
                  <p className="text-muted-foreground text-sm">
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
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
