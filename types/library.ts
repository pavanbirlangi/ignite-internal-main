export interface LibraryItemCategory {
  title: string
  handle: string
}

export interface LibraryItemGameLogo {
  name: string
  icon: string
}

export interface LibraryItemFeaturedImage {
  url: string
  altText: string | null
}

export interface LibraryItemPrice {
  amount: string
  currencyCode: string
}

export interface LibraryItemOption {
  name: string
  value: string
}

export interface LibraryItem {
  orderId: string
  orderNumber: number
  purchasedAt: string
  financialStatus: string
  productId: string
  handle: string
  title: string
  quantity: number
  variantId: string
  variantTitle: string
  selectedOptions: LibraryItemOption[]
  featuredImage: LibraryItemFeaturedImage | null
  price: LibraryItemPrice | null
  categories: LibraryItemCategory[]
  productType: string
  tags: string[]
  displayTags?: string[]
  platform: string[]
  region: string[]
  edition: string[]
  worksOn: string[]
  instantDelivery: boolean
  onSale: boolean
  gameLogo: LibraryItemGameLogo | null
}

export interface LibraryPagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface LibraryFilters {
  sort?: string
  order?: string
  category?: string
  platform?: string
  productType?: string
  search?: string
}

export interface LibraryFacets {
  categories: LibraryItemCategory[]
  platforms: string[]
  productTypes: string[]
}

export interface LibraryResponse {
  items: LibraryItem[]
  pagination: LibraryPagination
  filters: LibraryFilters
  facets: LibraryFacets
}

export interface GetLibraryParams {
  country?: string
  sort?: string
  order?: 'asc' | 'desc' | string
  category?: string
  platform?: string
  productType?: string
  search?: string
  page?: number
  limit?: number
}
