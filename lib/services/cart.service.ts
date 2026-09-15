import Cookies from 'js-cookie'
import medusaClient from '../medusa-axios'
import cmsClient from '../cms-axios'
import {
  ProductService,
  GetProductRecommendationsParams,
} from './product.service'
import { ProductListItem } from '@/types/product'
import { resolveRegionForCountry } from '../utils/region-resolver'

export interface CartCmsData {
  id: string
  acknowledgement_text?: string
  review_count?: string
  review_redirect_link?: string
}

export interface CartLineInput {
  merchandiseId: string
  quantity: number
}

export interface CartLineItem {
  id: string
  productId: string
  variantId: string
  handle?: string
  title: string
  variantTitle?: string
  quantity: number
  unitPrice: number
  compareAtUnitPrice: number | null
  thumbnail?: string
}

export interface CartResponse {
  id: string
  customerId: string | null
  currencyCode: string
  regionId: string | null
  subtotal: number
  total: number
  taxTotal: number
  shippingTotal: number
  items: CartLineItem[]
}

// Re-exported so `useCartStore.ts` can keep importing the recommendation
// type from `cart.service.ts` without knowing it's really a product list item.
export type CartRecommendation = ProductListItem

export type GetCartRecommendationsParams = GetProductRecommendationsParams

// ─── Region resolution ──────────────────────────────────────────────────────
// Medusa cart creation (`POST /store/carts`) only accepts `region_id`, not the
// `country_code` param the rest of the app uses for pricing context (confirmed
// live against the real validator) -- so carts need a real Medusa Region.
// Shared with useCurrencyStore.ts (Phase 10) via region-resolver.ts, rather
// than each maintaining its own independent country->region match, so a
// cart's currency can never drift from what the rest of the app is showing.
const resolveRegionId = async (): Promise<string> => {
  const country =
    typeof window !== 'undefined' ? Cookies.get('user_country') : undefined
  const region = await resolveRegionForCountry(country)
  return region.id
}

// ─── Response mapping ───────────────────────────────────────────────────────

function mapCartLineItem(raw: any): CartLineItem {
  return {
    id: raw.id,
    productId: raw.product_id,
    variantId: raw.variant_id,
    handle: raw.product_handle,
    title: raw.product_title || raw.title,
    variantTitle: raw.variant_title,
    quantity: raw.quantity,
    unitPrice: raw.unit_price,
    compareAtUnitPrice:
      typeof raw.compare_at_unit_price === 'number'
        ? raw.compare_at_unit_price
        : null,
    // Falls back to the product's own gallery images when no thumbnail was
    // set on the product (the line item snapshot just inherits whatever
    // product.thumbnail was at add-to-cart time, including null) -- same
    // fallback product.service.ts's mapProductListItem already applies.
    thumbnail: raw.thumbnail || raw.product?.images?.[0]?.url,
  }
}

function mapCart(raw: any): CartResponse {
  return {
    id: raw.id,
    customerId: raw.customer_id ?? null,
    currencyCode: raw.currency_code,
    regionId: raw.region_id ?? null,
    subtotal: raw.subtotal ?? 0,
    total: raw.total ?? 0,
    taxTotal: raw.tax_total ?? 0,
    shippingTotal: raw.shipping_total ?? 0,
    items: (raw.items ?? []).map(mapCartLineItem),
  }
}

// Appended (not replacing) Medusa's own default field set for every cart
// route below -- default line items already include `thumbnail`, but not
// the product's own gallery `images`, which is the only fallback available
// when a product has no thumbnail set (confirmed live: Fallout 76's cart
// line item has `thumbnail: null` even though the product has 3 real
// gallery images, same root cause as the store-grid thumbnail bug).
const CART_FIELDS = '+items.thumbnail,+items.product.images.url'

export const cartService = {
  createCart: async (): Promise<CartResponse> => {
    const regionId = await resolveRegionId()
    const { data } = await medusaClient.post('/store/carts', {
      region_id: regionId,
    })
    return mapCart(data.cart)
  },

  getCart: async (cartId: string): Promise<CartResponse> => {
    const encodedId = encodeURIComponent(cartId)
    const { data } = await medusaClient.get(`/store/carts/${encodedId}`, {
      params: { fields: CART_FIELDS },
    })
    return mapCart(data.cart)
  },

  /**
   * No cart-level recommendations route exists on the backend (confirmed
   * live: only `/store/products/:id/recommendations` does) -- so this seeds
   * recommendations off the cart's first line item's product, reusing the
   * same (uncached, client-safe) product-recommendations pipeline Phase 3
   * already built for enrichment with price/variant data.
   */
  getRecommendations: async (
    productId: string,
    params: GetCartRecommendationsParams = {},
  ): Promise<{ recommendations: ProductListItem[] }> => {
    const recommendations = await ProductService.getRecommendationsByProductId(
      productId,
      params,
    )
    return { recommendations }
  },

  addToCart: async (
    cartId: string,
    lines: CartLineInput[],
  ): Promise<CartResponse> => {
    const encodedId = encodeURIComponent(cartId)
    const [line] = lines
    const { data } = await medusaClient.post(
      `/store/carts/${encodedId}/line-items`,
      { variant_id: line.merchandiseId, quantity: line.quantity },
      { params: { fields: CART_FIELDS } },
    )
    return mapCart(data.cart)
  },

  removeFromCart: async (
    cartId: string,
    lineIds: string[],
  ): Promise<CartResponse | undefined> => {
    const encodedId = encodeURIComponent(cartId)
    let cart: CartResponse | undefined
    // Medusa only supports deleting one line item per call (confirmed live
    // against the real route) -- callers today always pass a single id.
    for (const lineId of lineIds) {
      const { data } = await medusaClient.delete(
        `/store/carts/${encodedId}/line-items/${encodeURIComponent(lineId)}`,
        { params: { fields: CART_FIELDS } },
      )
      cart = mapCart(data.parent)
    }
    return cart
  },

  updateCart: async (
    cartId: string,
    lines: { id: string; quantity: number }[],
  ): Promise<CartResponse | undefined> => {
    const encodedId = encodeURIComponent(cartId)
    let cart: CartResponse | undefined
    // Same one-line-item-per-call constraint as removeFromCart.
    for (const line of lines) {
      const { data } = await medusaClient.post(
        `/store/carts/${encodedId}/line-items/${encodeURIComponent(line.id)}`,
        { quantity: line.quantity },
        { params: { fields: CART_FIELDS } },
      )
      cart = mapCart(data.cart)
    }
    return cart
  },

  // Moves an already-existing cart onto a different Medusa region (confirmed
  // live against the core validator: `POST /store/carts/:id` accepts
  // `region_id`, same route `checkout.service.ts` uses for email). Medusa
  // recomputes every line item's unit price and the cart totals against the
  // new region's currency as part of `updateCartWorkflow` -- this is what
  // actually keeps an existing cart's currency in sync after the user
  // switches region via RegionToggle, since region creation
  // (`resolveRegionId()` above) only ever runs once, at cart creation time.
  updateCartRegion: async (
    cartId: string,
    regionId: string,
  ): Promise<CartResponse> => {
    const encodedId = encodeURIComponent(cartId)
    const { data } = await medusaClient.post(
      `/store/carts/${encodedId}`,
      { region_id: regionId },
      { params: { fields: CART_FIELDS } },
    )
    return mapCart(data.cart)
  },

  transferCart: async (cartId: string): Promise<CartResponse> => {
    const encodedId = encodeURIComponent(cartId)
    const { data } = await medusaClient.post(
      `/store/carts/${encodedId}/customer`,
      {},
      { params: { fields: CART_FIELDS } },
    )
    return mapCart(data.cart)
  },

  getCartCmsData: async (): Promise<CartCmsData | null> => {
    try {
      const response = await cmsClient.get<{ data: CartCmsData }>('/items/cart')
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch cart CMS data:', error)
      return null
    }
  },
}
