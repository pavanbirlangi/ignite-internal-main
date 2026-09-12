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
  hasShopifyDiscount?: boolean
  shopifyDiscountBreakdowns?: Array<{ title: string; amount: number }>
}

export interface CartState {
  items: CartProduct[]
  subtotal: number
  currency: string
}
