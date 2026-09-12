import apiClient from '../axios'
import cmsClient from '../cms-axios'

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

export interface CartResponse {
  id: string
  checkoutUrl: string
  lines?: {
    edges: any[]
  }
  cost?: {
    totalAmount: {
      amount: string
      currencyCode: string
    }
  }
  discountSummary?: {
    hasDiscount: boolean
    totalSavings?: {
      amount: string
      currencyCode: string
    }
  }
  fees?: {
    serviceCharge?: {
      amount: string
      currencyCode: string
    }
    userCharge?: {
      amount: string
      currencyCode: string
    }
  }
}

export interface GetCartRecommendationsParams {
  intent?: 'RELATED' | 'COMPLEMENTARY'
  limit?: number
}

export interface CartRecommendationPrice {
  amount: string
  currencyCode: string
}

export interface CartRecommendationVariant {
  id?: string
  availableForSale?: boolean
}

export interface CartRecommendation {
  id: string
  title: string
  handle?: string
  availableForSale?: boolean
  featuredImage?: {
    url?: string
    altText?: string | null
  } | null
  price?: CartRecommendationPrice
  compareAtPrice?: CartRecommendationPrice
  discount?: {
    amount?: string
    percentage?: number
  } | null
  platform?: string[]
  variants?:
    | {
        edges?: Array<{
          node?: CartRecommendationVariant
        }>
      }
    | CartRecommendationVariant[]
}

export interface CartRecommendationsResponse {
  cartId: string
  intent: 'RELATED' | 'COMPLEMENTARY'
  count: number
  recommendations: CartRecommendation[]
}

export const cartService = {
  createCart: async (): Promise<CartResponse> => {
    const response = await apiClient.post<CartResponse>('/cart')
    return response.data
  },

  getCart: async (cartId: string): Promise<CartResponse> => {
    const encodedId = encodeURIComponent(cartId)
    const response = await apiClient.get<CartResponse>(`/cart/${encodedId}`)
    return response.data
  },

  getRecommendations: async (
    cartId: string,
    params: GetCartRecommendationsParams = {},
  ): Promise<CartRecommendationsResponse> => {
    const encodedId = encodeURIComponent(cartId)
    const response = await apiClient.get<CartRecommendationsResponse>(
      `/cart/${encodedId}/recommendations`,
      {
        params,
      },
    )
    return response.data
  },

  addToCart: async (cartId: string, lines: CartLineInput[]): Promise<any> => {
    const response = await apiClient.post('/cart/add', {
      cartId,
      lines,
    })
    return response.data
  },

  transferCart: async (cartId: string): Promise<any> => {
    const response = await apiClient.post('/cart/transfer', {
      cartId,
    })
    return response.data
  },

  removeFromCart: async (cartId: string, lineIds: string[]): Promise<any> => {
    const response = await apiClient.post('/cart/remove', {
      cartId,
      lineIds,
    })
    return response.data
  },

  updateCart: async (
    cartId: string,
    lines: { id: string; quantity: number }[],
  ): Promise<any> => {
    const response = await apiClient.post('/cart/update', {
      cartId,
      lines,
    })
    return response.data
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
