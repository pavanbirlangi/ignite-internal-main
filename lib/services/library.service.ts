import medusaClient from '../medusa-axios'
import type { GetLibraryParams, LibraryItem, LibraryResponse } from '@/types/library'

function mapLibraryItem(raw: any): LibraryItem {
  // The backend returns a single nullable `category` per item (`{id, name}`),
  // not a list -- wrapped in a one-element array here so `LibraryItem.categories`
  // stays the array shape the reveal modal (`LibraryModals.tsx`) already maps
  // over unchanged. `handle` is populated with the real category id (not an
  // actual URL handle) because that's what `LibraryTabs`' filter click sends
  // straight back as the `category` query param, and that's what the backend
  // route matches against (`item.category?.id === categoryFilter`).
  const category = raw.category as { id?: string; name?: string } | null
  const categories =
    category?.id && category?.name
      ? [{ title: category.name, handle: category.id }]
      : []

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
    categories,
    platform: Array.isArray(raw.platform) ? raw.platform : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    displayTags: Array.isArray(raw.tags) ? raw.tags : [],
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
   * `category`/`platform`/`productType` filtering and real facets now work
   * server-side (confirmed live) -- `category` matches a real Medusa
   * category id, `platform` matches product metadata (comma-separated
   * match-any, though this frontend only ever sends one at a time today),
   * `productType` matches Medusa's native product.type relation. Facets are
   * computed over the customer's own library, not the whole catalog. Still
   * comes back empty for this demo store today since the one real product
   * has no category/platform/type set in the catalog yet -- `LibraryTabs.tsx`
   * already hides itself when facets are empty, so nothing to adapt there;
   * it'll just start rendering once real catalog data exists.
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
      // Backend facets carry per-value counts ({id/name, count}) that
      // LibraryTabs.tsx has no UI for today -- dropped here rather than
      // widening that already-working component's props for an unused value.
      facets: {
        categories: (data.facets?.categories ?? []).map(
          (c: { id: string; name: string }) => ({
            title: c.name,
            handle: c.id,
          }),
        ),
        platforms: (data.facets?.platforms ?? []).map(
          (p: { name: string }) => p.name,
        ),
        productTypes: (data.facets?.product_types ?? []).map(
          (t: { name: string }) => t.name,
        ),
      },
    }
  },
}
