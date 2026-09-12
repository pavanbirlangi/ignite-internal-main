import apiClient from '../axios'

export interface WishlistAddResponse {
  message: string
  success: boolean
}

export interface WishlistRemoveResponse {
  message: string
  success: boolean
}

export interface WishlistStatusResponse {
  isInWishlist: boolean
}

export interface WishlistVariantPrice {
  amount: string
  currencyCode: string
}

export interface WishlistVariant {
  id: string
  title: string
  availableForSale: boolean
  price: WishlistVariantPrice
  compareAtPrice: WishlistVariantPrice | null
  selectedOptions?: { name: string; value: string }[]
  discount?: { amount: string; percentage: number } | null
}

export interface WishlistProduct {
  id: string
  title: string
  handle: string
  description?: string
  productType: string
  availableForSale?: boolean
  tags?: string[]
  collections?: {
    edges: {
      node: { title: string; handle: string }
    }[]
  }
  featuredImage: {
    url: string
    altText: string | null
  }
  priceRange?: {
    minVariantPrice: WishlistVariantPrice
  }
  compareAtPriceRange?: {
    minVariantPrice: WishlistVariantPrice
  }
  price?: WishlistVariantPrice
  compareAtPrice?: WishlistVariantPrice | null
  discount?: { amount: string; percentage: number } | null
  instantDelivery?: boolean
  onSale?: boolean
  featured?: boolean
  gameLogo?: { name?: string; icon?: string } | null
  worksOn?: string[]
  platform?: string[]
  region?: string[]
  edition?: string[]
  genre?: string
  variants: WishlistVariant[]
  variantOptions?: { name: string; value: string }[][]
}

export interface WishlistResponse {
  items: WishlistProduct[]
  pageInfo: {
    hasNextPage: boolean
    endCursor: string | null
    totalCount: number
  }
}

export interface GetWishlistParams {
  first?: number
  after?: string
  search?: string
}

export const wishlistService = {
  addToWishlist: async (productId: string): Promise<WishlistAddResponse> => {
    const response = await apiClient.post<WishlistAddResponse>(
      '/wishlist/add',
      {
        productId,
      },
    )
    return response.data
  },

  getWishlist: async (params: GetWishlistParams): Promise<WishlistResponse> => {
    const response = await apiClient.get<WishlistResponse>('/wishlist', {
      params,
    })
    return response.data
  },

  removeFromWishlist: async (
    productId: string,
  ): Promise<WishlistRemoveResponse> => {
    const response = await apiClient.post<WishlistRemoveResponse>(
      '/wishlist/remove',
      {
        productId,
      },
    )
    return response.data
  },

  checkWishlistStatus: async (
    productId: string,
  ): Promise<WishlistStatusResponse> => {
    const encodedId = encodeURIComponent(productId)
    const response = await apiClient.get<WishlistStatusResponse>(
      `/wishlist/check/${encodedId}`,
    )
    return response.data
  },
}
