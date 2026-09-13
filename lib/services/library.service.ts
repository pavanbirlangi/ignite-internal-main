import medusaClient from '../medusa-axios'
import type { GetLibraryParams, LibraryItem, LibraryResponse } from '@/types/library'

function mapLibraryItem(raw: any): LibraryItem {
  return {
    orderId: raw.order_id,
    purchasedAt: raw.purchased_at ?? '',
    productId: raw.product_id ?? '',
    handle: raw.handle ?? '',
    title: raw.title ?? '',
    variantId: raw.variant_id,
    variantTitle: raw.variant_title ?? '',
    featuredImage: raw.thumbnail_url
      ? { url: raw.thumbnail_url, altText: raw.title ?? null }
      : null,
    productType: raw.product_type ?? '',
    keyStatus: raw.key_status,
    categories: [],
    platform: [],
    tags: [],
    displayTags: [],
    selectedOptions: [],
  }
}

export const libraryService = {
  /**
   * Rebuilt against the real `GET /store/customers/me/library`. Confirmed
   * live: only `sort=title` is specially handled (everything else sorts by
   * `purchased_at`), and only `order=asc` is recognized (anything else
   * defaults to descending) -- `LibraryHeader.tsx`'s three sort options
   * already match this exactly, nothing further to adapt there.
   *
   * `category`/`platform`/`productType` are sent through as-is even though
   * the backend silently ignores them (v1 scope, confirmed live: the
   * `facets` object is a permanent `{categories:[],platforms:[],
   * product_types:[]}` stub) -- harmless no-ops, and the corresponding
   * filter UI never renders in the first place since `LibraryTabs.tsx`
   * already hides itself when facets are empty.
   */
  getLibrary: async (
    params: GetLibraryParams = {},
  ): Promise<LibraryResponse> => {
    const { data } = await medusaClient.get('/store/customers/me/library', {
      params: {
        search: params.search || undefined,
        sort: params.sort,
        order: params.order,
        category: params.category || undefined,
        platform: params.platform || undefined,
        productType: params.productType || undefined,
        page: params.page,
        limit: params.limit,
      },
    })

    return {
      items: (data.items ?? []).map(mapLibraryItem),
      pagination: {
        page: data.pagination?.page ?? 1,
        limit: data.pagination?.limit ?? 20,
        totalItems: data.pagination?.total_items ?? 0,
        totalPages: data.pagination?.total_pages ?? 0,
        hasNextPage: Boolean(data.pagination?.has_next_page),
        hasPrevPage: Boolean(data.pagination?.has_prev_page),
      },
      facets: {
        categories: data.facets?.categories ?? [],
        platforms: data.facets?.platforms ?? [],
        productTypes: data.facets?.product_types ?? [],
      },
    }
  },
}
