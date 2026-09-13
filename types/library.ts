export interface LibraryItemCategory {
  title: string
  handle: string
}

export interface LibraryItemImage {
  url: string
  altText: string | null
}

export type LibraryKeyStatus = 'pending_manual' | 'assigned' | 'revealed' | 'refunded'

export interface LibraryItem {
  orderId: string
  purchasedAt: string
  productId: string
  handle: string
  title: string
  variantId: string
  variantTitle: string
  featuredImage: LibraryItemImage | null
  productType: string
  keyStatus: LibraryKeyStatus
  // Permanently empty -- confirmed live the backend hardcodes category/platform/product-option
  // data to null on this route (v1 scope, no real facet data wired in yet). Kept only so the
  // existing components' already-graceful empty-state handling keeps working unchanged.
  categories: LibraryItemCategory[]
  platform: string[]
  tags: string[]
  displayTags?: string[]
  selectedOptions: { name: string; value: string }[]
}

export interface LibraryPagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface LibraryFacets {
  categories: LibraryItemCategory[]
  platforms: string[]
  productTypes: string[]
}

export interface LibraryResponse {
  items: LibraryItem[]
  pagination: LibraryPagination
  facets: LibraryFacets
}

export interface GetLibraryParams {
  sort?: string
  order?: 'asc' | 'desc' | string
  category?: string
  platform?: string
  productType?: string
  search?: string
  page?: number
  limit?: number
}
