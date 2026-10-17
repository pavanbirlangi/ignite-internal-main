import { create } from 'zustand'
import Cookies from 'js-cookie'
import {
  cartService,
  CartResponse,
  CartRecommendation,
  CartCmsData,
} from '../lib/services/cart.service'
import { toast } from 'sonner'
import { useUserStore } from './useUserStore'
import { useAuthModalStore } from './useAuthModalStore'
import { showAddedToCartToast } from '@/components/cart/AddedToCartToast'
import {
  extractApiErrorMessage,
  isCartNotFoundError,
  isCartCompletedError,
} from '@/lib/utils/api-error'
import { getStoredAttribution } from '@/lib/utils/attribution'
import { DEFAULT_CURRENCY } from '@/lib/utils/display-currency'

const CART_ID_COOKIE_NAME = 'increddy_cart_id'
const CART_ID_COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 30,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

const getCartIdFromCookie = () => {
  if (typeof window === 'undefined') return null
  return Cookies.get(CART_ID_COOKIE_NAME) || null
}

const setCartIdCookie = (cartId: string) => {
  if (typeof window === 'undefined') return
  Cookies.set(CART_ID_COOKIE_NAME, cartId, CART_ID_COOKIE_OPTIONS)
}

const clearCartIdCookie = () => {
  if (typeof window === 'undefined') return
  Cookies.remove(CART_ID_COOKIE_NAME, { path: '/' })
}

const getCartLineQuantity = (cart: CartResponse | null, lineId: string) => {
  const quantity = cart?.items?.find((item) => item.id === lineId)?.quantity

  return typeof quantity === 'number' ? quantity : null
}

const getSeedProductId = (cart: CartResponse | null) => cart?.items?.[0]?.productId

interface CartState {
  cartId: string | null
  cart: CartResponse | null
  cartCmsData: CartCmsData | null
  recommendations: CartRecommendation[]
  isLoading: boolean
  // Counts items the customer has added (not cart loads), so the header can react to each add.
  itemsAdded: number
  isRecommendationsLoading: boolean
  loadingItems: string[]
  error: string | null
  recommendationsError: string | null

  initCart: () => Promise<void>
  loadCart: () => Promise<void>
  loadRecommendations: (params?: {
    intent?: 'RELATED' | 'COMPLEMENTARY'
    limit?: number
  }) => Promise<void>
  /** `notify: false` skips the Added-to-cart popup, e.g. when adding from
   *  inside the cart drawer, where the item appears in the list anyway. */
  addItem: (
    merchandiseId: string,
    quantity: number,
    options?: { notify?: boolean },
  ) => Promise<void>
  updateItem: (lineId: string, quantity: number) => Promise<void>
  removeItem: (lineIds: string[]) => Promise<void>
  clearCart: () => void
  loadCartCmsData: () => Promise<void>
  transferGuestCartToUser: () => Promise<void>
  // Awaited explicitly by the checkout flow right before payment starts, on top of the
  // fire-and-forget calls every cart mutation already makes -- see syncServiceFee below.
  applyServiceFee: () => Promise<void>
  applyPromoCode: (code: string) => Promise<void>
  removePromoCode: (code: string) => Promise<void>
}

// Carts are USD-only now (the display currency only changes how amounts are shown). A cart created
// before that, in another currency, is moved to USD once: the backend copies it into a new USD
// cart, which carries neither promo codes nor the service fee line, so both are restored here.
const ensureUsdCart = async (
  set: (partial: Partial<CartState>) => void,
  get: () => CartState,
  cart: CartResponse,
): Promise<CartResponse> => {
  if (cart.chargeCurrencyCode.toLowerCase() === DEFAULT_CURRENCY) return cart

  const { cartId } = await cartService.switchCurrency(cart.id, DEFAULT_CURRENCY)
  setCartIdCookie(cartId)
  set({ cartId })

  const droppedPromoCodes: string[] = []
  for (const code of cart.promoCodes) {
    try {
      await cartService.applyPromoCode(cartId, code)
    } catch {
      droppedPromoCodes.push(code)
    }
  }
  if (droppedPromoCodes.length) {
    toast.info(`Coupon ${droppedPromoCodes.join(', ')} no longer applies and was removed.`)
  }

  let movedCart: CartResponse
  try {
    movedCart = await cartService.applyServiceFee(cartId)
  } catch (error) {
    console.error('Failed to apply service fee after moving the cart to USD', error)
    movedCart = await cartService.getCart(cartId)
  }
  if (get().cartId === cartId) set({ cart: movedCart })
  return movedCart
}

// Re-applies the service fee whenever the cart's items or region changed (item 14) --
// fire-and-forget, since a moment-stale fee is harmless: the checkout flow re-applies it
// synchronously right before payment (see CheckoutPageContent.tsx), and every other mutation
// point below calls this too, so it self-corrects almost immediately either way. Guarded against
// the cart having moved on (a different cart, or none) by the time this resolves.
const syncServiceFee = (
  set: (partial: Partial<CartState>) => void,
  get: () => CartState,
  cartId: string,
) => {
  cartService
    .applyServiceFee(cartId)
    .then((cart) => {
      if (get().cartId === cartId) set({ cart })
    })
    .catch((error) => {
      console.error('Failed to sync service fee', error)
    })
}

// Mini-cart confirmation popup for a successful add-to-cart. Every cart
// mutation returns the full updated cart, so the line item just added is
// already in hand here -- no extra fetch needed to show its image/title/price.
// `quantity` is that variant's total in the cart (not the delta), which is
// what a mini-cart should reflect when the same item is added twice.
const notifyItemAdded = (cart: CartResponse, variantId: string) => {
  // Not on phones: the bottom nav's cart (shown below md, see MobileNav)
  // already confirms the add with its count, and product covers fly into it.
  if (window.matchMedia('(max-width: 767px)').matches) return

  const line = cart.items.find((item) => item.variantId === variantId)
  if (!line) {
    toast.success('Added to cart')
    return
  }
  showAddedToCartToast({
    title: line.title,
    thumbnail: line.thumbnail,
    unitPrice: line.unitPrice,
    quantity: line.quantity,
    currencyCode: cart.currencyCode,
  })
}

// Every cart mutation route already returns the full updated cart in its
// response (confirmed live against the real backend) -- so the only extra
// work worth doing after applying it is refreshing recommendations, and
// only when the cart's seed product actually changed (recommendations are
// keyed off the first line item, see cart.service.ts). Skipping both the
// redundant `GET /store/carts/:id` refetch and needless recommendation
// refetches is what actually made add/update/remove feel slow -- each one
// used to chain 3-4 sequential network round-trips before the UI unblocked.
const maybeRefreshRecommendations = (
  get: () => CartState,
  previousCart: CartResponse | null,
) => {
  if (getSeedProductId(previousCart) === getSeedProductId(get().cart)) return
  void get().loadRecommendations()
}

export const useCartStore = create<CartState>()((set, get) => ({
  cartId: getCartIdFromCookie(),
  cart: null,
  cartCmsData: null,
  recommendations: [],
  isLoading: false,
  itemsAdded: 0,
  isRecommendationsLoading: false,
  loadingItems: [],
  error: null,
  recommendationsError: null,

  initCart: async () => {
    const { loadCart, loadCartCmsData } = get()
    loadCartCmsData()
    const existingCartId = get().cartId || getCartIdFromCookie()

    if (existingCartId) {
      if (!get().cartId) {
        set({ cartId: existingCartId })
      }
      await loadCart()
      return
    }

    try {
      set({ isLoading: true, error: null })
      // Attribution feeds the admin "Order source" widget; it's attached at creation so it never
      // needs a separate cart update (see cartService.createCart).
      const attribution = getStoredAttribution()
      const metadata = attribution
        ? (Object.fromEntries(
            Object.entries(attribution).filter(([, value]) => value),
          ) as Record<string, string>)
        : undefined
      const newCart = await cartService.createCart(metadata)
      setCartIdCookie(newCart.id)
      set({
        cartId: newCart.id,
        cart: newCart,
        recommendations: [],
        isLoading: false,
      })
    } catch (error: any) {
      const errorMessage = extractApiErrorMessage(
        error,
        'Failed to initialize cart',
      )
      console.error('Error initializing cart', error)
      set({ error: errorMessage, isLoading: false })
    }
  },

  loadCart: async () => {
    const cartId = get().cartId || getCartIdFromCookie()
    if (!cartId) {
      set({ cartId: null, cart: null, isLoading: false })
      return
    }

    if (!getCartIdFromCookie()) {
      setCartIdCookie(cartId)
    }

    if (get().cartId !== cartId) {
      set({ cartId })
    }

    try {
      set({ isLoading: true, error: null })
      const previousCart = get().cart
      const cart = await ensureUsdCart(set, get, await cartService.getCart(cartId))

      set({ cart, isLoading: false })
      maybeRefreshRecommendations(get, previousCart)
    } catch (error: any) {
      const errorMessage = extractApiErrorMessage(error, 'Failed to load cart')
      console.error('Error loading cart', error)
      if (isCartNotFoundError(error) || isCartCompletedError(error)) {
        clearCartIdCookie()
        set({
          cartId: null,
          cart: null,
          recommendations: [],
          isLoading: false,
          error: null,
          recommendationsError: null,
        })
        return
      }
      set({ error: errorMessage, isLoading: false })
    }
  },

  loadRecommendations: async (params = { intent: 'RELATED', limit: 4 }) => {
    // No cart-level recommendations route exists on the backend -- seed off
    // the cart's first line item's product instead (see cart.service.ts).
    const productId = get().cart?.items?.[0]?.productId

    if (!productId) {
      set({ recommendations: [], isRecommendationsLoading: false })
      return
    }

    try {
      set({ isRecommendationsLoading: true, recommendationsError: null })
      const response = await cartService.getRecommendations(productId, params)
      set({
        recommendations: response.recommendations || [],
        isRecommendationsLoading: false,
      })
    } catch (error: any) {
      const errorMessage = extractApiErrorMessage(
        error,
        'Failed to load recommendations',
      )
      console.error('Error loading recommendations', error)
      set({
        recommendations: [],
        recommendationsError: errorMessage,
        isRecommendationsLoading: false,
      })
    }
  },

  addItem: async (merchandiseId: string, quantity: number, options) => {
    const { initCart } = get()

    let targetCartId = get().cartId || getCartIdFromCookie()
    if (!targetCartId) {
      await initCart()
      targetCartId = get().cartId
    }

    if (!targetCartId) {
      toast.error('Failed to initialize cart')
      return
    }

    if (!getCartIdFromCookie()) {
      setCartIdCookie(targetCartId)
    }

    try {
      set({ isLoading: true, error: null })
      const previousCart = get().cart
      if (previousCart) {
        targetCartId = (await ensureUsdCart(set, get, previousCart)).id
      }
      const updatedCart = await cartService.addToCart(targetCartId, [{ merchandiseId, quantity }])
      set({ cart: updatedCart, isLoading: false })
      syncServiceFee(set, get, updatedCart.id)
      maybeRefreshRecommendations(get, previousCart)
      set({ itemsAdded: get().itemsAdded + 1 })
      if (options?.notify !== false) notifyItemAdded(updatedCart, merchandiseId)
    } catch (error: any) {
      const errorMessage = extractApiErrorMessage(
        error,
        'Failed to add to cart',
      )
      console.error('Error adding to cart', error)

      if (isCartNotFoundError(error) || isCartCompletedError(error)) {
        clearCartIdCookie()
        set({ cartId: null, cart: null, isLoading: false, error: null })

        try {
          await initCart()
          const freshCartId = get().cartId

          if (!freshCartId) {
            toast.error(
              'Your previous cart expired. Please add the item again.',
            )
            return
          }

          const previousCart = get().cart
          const retryCart = await cartService.addToCart(freshCartId, [
            { merchandiseId, quantity },
          ])
          set({ cart: retryCart, isLoading: false })
          syncServiceFee(set, get, retryCart.id)
          maybeRefreshRecommendations(get, previousCart)
          set({ itemsAdded: get().itemsAdded + 1 })
          if (options?.notify !== false) notifyItemAdded(retryCart, merchandiseId)
          return
        } catch (retryError) {
          const retryErrorMessage = extractApiErrorMessage(
            retryError,
            'Failed to add to cart',
          )
          toast.error(retryErrorMessage)
          set({ error: retryErrorMessage, isLoading: false })
          return
        }
      }

      toast.error(errorMessage)
      set({ error: errorMessage, isLoading: false })
    }
  },

  removeItem: async (lineIds: string[]) => {
    const { cartId: currentCartId } = get()
    let cartId = currentCartId || getCartIdFromCookie()
    if (!cartId) return

    if (!getCartIdFromCookie()) {
      setCartIdCookie(cartId)
    }

    if (currentCartId !== cartId) {
      set({ cartId })
    }

    try {
      set({ loadingItems: [...get().loadingItems, ...lineIds], error: null })
      const previousCart = get().cart
      const updatedCart = await cartService.removeFromCart(cartId, lineIds)
      if (updatedCart) {
        set({ cart: updatedCart })
        syncServiceFee(set, get, updatedCart.id)
        maybeRefreshRecommendations(get, previousCart)
      }
      toast.success('Removed from cart')
    } catch (error: any) {
      const errorMessage = extractApiErrorMessage(
        error,
        'Failed to remove item',
      )
      console.error('Error removing from cart', error)

      if (isCartNotFoundError(error) || isCartCompletedError(error)) {
        clearCartIdCookie()
        set({ cartId: null, cart: null, error: null })
        toast.error(
          'Your previous cart was already completed. A new cart is ready.',
        )
        return
      }

      toast.error(errorMessage)
      set({
        error: errorMessage,
      })
    } finally {
      set({
        loadingItems: get().loadingItems.filter((id) => !lineIds.includes(id)),
      })
    }
  },

  updateItem: async (lineId: string, quantity: number) => {
    const { cartId: currentCartId } = get()
    let cartId = currentCartId || getCartIdFromCookie()
    if (!cartId) return

    if (!getCartIdFromCookie()) {
      setCartIdCookie(cartId)
    }

    if (currentCartId !== cartId) {
      set({ cartId })
    }

    try {
      set({ loadingItems: [...get().loadingItems, lineId], error: null })
      const previousCart = get().cart
      const updatedCart = await cartService.updateCart(cartId, [
        { id: lineId, quantity },
      ])
      if (updatedCart) {
        set({ cart: updatedCart })
        syncServiceFee(set, get, updatedCart.id)
        maybeRefreshRecommendations(get, previousCart)
      }

      const actualQuantity = getCartLineQuantity(get().cart, lineId)
      if (actualQuantity !== quantity) {
        const mismatchMessage =
          actualQuantity === null
            ? 'We could not update this item quantity. Please try again.'
            : actualQuantity === 0
              ? 'This item is no longer available in the selected quantity.'
              : `Only ${actualQuantity} item${actualQuantity === 1 ? '' : 's'} are available for this product.`

        toast.info(mismatchMessage)
        set({ error: mismatchMessage })
      }
    } catch (error: any) {
      const errorMessage = extractApiErrorMessage(
        error,
        'Failed to update item quantity',
      )
      console.error('Error updating cart', error)

      if (isCartNotFoundError(error) || isCartCompletedError(error)) {
        clearCartIdCookie()
        set({ cartId: null, cart: null, error: null })
        toast.error(
          'Your previous cart was already completed. A new cart is ready.',
        )
        return
      }

      toast.error(errorMessage)
      set({
        error: errorMessage,
      })
    } finally {
      set({ loadingItems: get().loadingItems.filter((id) => id !== lineId) })
    }
  },

  clearCart: () => {
    clearCartIdCookie()
    set({
      cartId: null,
      cart: null,
      recommendations: [],
      error: null,
      recommendationsError: null,
      loadingItems: [],
    })
  },

  // Awaited (unlike syncServiceFee's fire-and-forget) so the checkout flow can guarantee the
  // fee is current before creating a payment session -- see CheckoutPageContent.tsx.
  applyServiceFee: async () => {
    const cartId = get().cartId || getCartIdFromCookie()
    if (!cartId) return
    const cart = await cartService.applyServiceFee(cartId)
    if (get().cartId === cartId || !get().cartId) {
      set({ cart, cartId })
    }
  },

  // Coupon codes. Errors are left to the caller (CouponInput shows them inline) rather than a
  // toast, since "this code is invalid" belongs right next to the input that was typed into, not
  // a global notification.
  applyPromoCode: async (code: string) => {
    const cartId = get().cartId || getCartIdFromCookie()
    if (!cartId) return
    const cart = await cartService.applyPromoCode(cartId, code)
    set({ cart })
  },

  removePromoCode: async (code: string) => {
    const cartId = get().cartId || getCartIdFromCookie()
    if (!cartId) return
    const cart = await cartService.removePromoCode(cartId, code)
    set({ cart })
  },

  loadCartCmsData: async () => {
    if (get().cartCmsData) return
    try {
      const data = await cartService.getCartCmsData()
      if (data) {
        set({ cartCmsData: data })
      }
    } catch (error) {
      console.error('Failed to load cart CMS data', error)
    }
  },

  transferGuestCartToUser: async () => {
    const { loadCart, cartId: currentCartId } = get()
    const cartId = currentCartId || getCartIdFromCookie()

    if (!cartId) {
      // If there's no guest cart, just load whatever cart the user might already have
      await loadCart()
      return
    }

    try {
      set({ isLoading: true, error: null })
      const previousCart = get().cart
      const updatedCart = await cartService.transferCart(cartId)
      set({ cart: updatedCart, isLoading: false })
      maybeRefreshRecommendations(get, previousCart)
    } catch (error: any) {
      console.error('Error transferring cart', error)
      // Even if transfer fails (e.g. cart already transferred or invalid),
      // we should still try to load the cart for the user
      await loadCart()
    }
  },
}))
