import medusaClient from '../medusa-axios'
import { ProductService } from './product.service'
import type { ProductListItem } from '@/types/product'

export interface GetWishlistParams {
  page?: number
  limit?: number
  search?: string
}

export interface WishlistPagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface WishlistResponse {
  products: ProductListItem[]
  pagination: WishlistPagination
}

export interface WishlistStatusResponse {
  isInWishlist: boolean
}

export const wishlistService = {
  addToWishlist: async (productId: string): Promise<void> => {
    await medusaClient.post('/store/customers/me/wishlist', {
      product_id: productId,
    })
  },

  removeFromWishlist: async (productId: string): Promise<void> => {
    await medusaClient.delete(
      `/store/customers/me/wishlist/${encodeURIComponent(productId)}`,
    )
  },

  checkWishlistStatus: async (
    productId: string,
  ): Promise<WishlistStatusResponse> => {
    const { data } = await medusaClient.get(
      `/store/customers/me/wishlist/${encodeURIComponent(productId)}`,
    )
    return { isInWishlist: !!data.is_in_wishlist }
  },

  /**
   * The list route only returns `{id, title, handle, thumbnail}` per product
   * (confirmed live, despite its own code comment claiming otherwise) -- no
   * pricing/variants -- so this enriches with a second call, same pattern as
   * `product.service.ts`'s store-grid/recommendations enrichment.
   */
  getWishlist: async (params: GetWishlistParams = {}): Promise<WishlistResponse> => {
    const { data } = await medusaClient.get('/store/customers/me/wishlist', {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        search: params.search,
      },
    })

    const bareProducts: Array<{ id: string }> = data.products ?? []
    const ids = bareProducts.map((p) => p.id)
    const enriched = await ProductService.getProductsByIds(ids)

    // Preserve the wishlist's own order (most-recently-added first) rather
    // than whatever order the enrichment call happens to return in.
    const orderIndex = new Map(ids.map((id, i) => [id, i]))
    const products: ProductListItem[] = [...enriched].sort(
      (a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0),
    )

    const pagination = data.pagination ?? {}
    return {
      products,
      pagination: {
        page: pagination.page ?? 1,
        limit: pagination.limit ?? 20,
        totalItems: pagination.total_items ?? products.length,
        totalPages: pagination.total_pages ?? 1,
        hasNextPage: Boolean(pagination.has_next_page),
        hasPrevPage: Boolean(pagination.has_prev_page),
      },
    }
  },
}
