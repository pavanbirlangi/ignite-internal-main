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
import {
  extractApiErrorMessage,
  isCartNotFoundError,
  isCartCompletedError,
} from '@/lib/utils/api-error'

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
  isRecommendationsLoading: boolean
  isMigratingRegion: boolean
  loadingItems: string[]
  error: string | null
  recommendationsError: string | null

  initCart: () => Promise<void>
  loadCart: () => Promise<void>
  loadRecommendations: (params?: {
    intent?: 'RELATED' | 'COMPLEMENTARY'
    limit?: number
  }) => Promise<void>
  addItem: (merchandiseId: string, quantity: number) => Promise<void>
  updateItem: (lineId: string, quantity: number) => Promise<void>
  removeItem: (lineIds: string[]) => Promise<void>
  clearCart: () => void
  loadCartCmsData: () => Promise<void>
  transferGuestCartToUser: () => Promise<void>
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
  isRecommendationsLoading: false,
  isMigratingRegion: false,
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
      const newCart = await cartService.createCart()
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
      const cart = await cartService.getCart(cartId)

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

  addItem: async (merchandiseId: string, quantity: number) => {
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
      const updatedCart = await cartService.addToCart(targetCartId, [
        { merchandiseId, quantity },
      ])
      set({ cart: updatedCart, isLoading: false })
      maybeRefreshRecommendations(get, previousCart)
      toast.success('Added to cart')
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
          maybeRefreshRecommendations(get, previousCart)
          toast.success('Added to cart')
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
