export interface CartProduct {
  id: string
  handle?: string
  merchandiseId?: string
  title: string
  platform: string // e.g., "Rockstar Games - PC/Linux"
  price: number
  currencyCode?: string
  originalPrice?: number
  discountPercentage?: number
  image: string
  badges?: string[] // e.g., ["GAME", "DIGITAL KEY"]
  availableForSale?: boolean
  // Cart page: the platform shown under the title.
  platformInfo?: { name: string; icon: string | null }
  hasShopifyDiscount?: boolean
  shopifyDiscountBreakdowns?: Array<{ title: string; amount: number }>
}

export interface CartState {
  items: CartProduct[]
  subtotal: number
  currency: string
}
