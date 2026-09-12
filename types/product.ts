export interface ProductSelectedOption {
  name: string
  value: string
}

export interface ProductVariantPrice {
  amount: string
  currencyCode: string
}

export interface ProductVariantImage {
  url: string
  altText: string | null
  width?: number
  height?: number
}

export interface ProductVariantDiscount {
  amount: string
  percentage: number
}

export interface ProductVariant {
  id: string
  title: string
  price: ProductVariantPrice
  compareAtPrice: ProductVariantPrice | null
  availableForSale: boolean
  quantityAvailable: number
  selectedOptions: ProductSelectedOption[]
  image: ProductVariantImage
  discount: ProductVariantDiscount | null
}

export interface ProductOption {
  name: string
  values: string[]
}

export interface ProductRating {
  scale_min: string
  scale_max: string
  value: string
}

export interface ProductGalleryItem {
  type: 'IMAGE' | 'EXTERNAL_VIDEO'
  url: string
  host?: 'YOUTUBE' | 'VIMEO'
  previewImage?: string
  altText: string | null
}

export interface ProductSystemRequirementDetail {
  graphics?: Array<{
    graphics_card: string
    _type: string
    _handle: string
  }>
  os?: {
    name: string
    _type: string
    _handle: string
  }
  processors?: Array<{
    _type: string
    _handle: string
  }>
  storage?: {
    storage: string
    _type: string
    _handle: string
  }
  _type: string
  _handle: string
}

export interface ProductSystemRequirement {
  name: string
  platform: {
    name: string
    _type: string
    _handle: string
  }
  minimum: ProductSystemRequirementDetail
  recommended: ProductSystemRequirementDetail
  _type: string
  _handle: string
}

export interface ProductSystemRequirementItem {
  max: string
  min: string
  name: string
  _type: string
}

export interface Product {
  id: string
  title: string
  handle: string
  availableForSale: boolean
  totalInventory: number
  description: string
  descriptionHtml: string
  images?: {
    edges: Array<{
      node: ProductVariantImage
    }>
  }
  gallery: ProductGalleryItem[]
  variants:
    | {
        edges: Array<{
          node: ProductVariant
        }>
      }
    | ProductVariant[]
  options: ProductOption[]
  instantDelivery: boolean
  onSale: boolean
  featured: boolean
  platform: string[]
  region?: string[]
  systemRequirements?: ProductSystemRequirement[]
  minimumRequirements?: ProductSystemRequirementItem[]
  backgroundImage?: ProductVariantImage | null
  featuredImageMeta?: {
    reference?: {
      image?: ProductVariantImage | null
    }
  } | null
  featuredImage?: ProductVariantImage | null
  rating: ProductRating | null
  inStock: boolean
  stockQuantity: number
  price?: ProductVariantPrice
  compareAtPrice?: ProductVariantPrice | null
  discount?: ProductVariantDiscount | null
  activationGuide?: {
    guide: string
    name: string
    icon?: string | null
    _type: string
    _handle: string
  }
  tags?: string[]
  importantNotice?: string
}

export interface ProductListVariantOption {
  name: string
  value: string
}

export interface ProductListVariant {
  id: string
  title?: string
  availableForSale?: boolean
  selectedOptions?: ProductListVariantOption[]
}

export interface ProductListVariantEdge {
  node: {
    id?: string
    availableForSale?: boolean
    selectedOptions?: ProductListVariantOption[]
  }
}

export interface ProductListCollectionNode {
  title: string
  handle: string
}

export interface ProductListCollectionEdge {
  node: ProductListCollectionNode
}

export interface ProductListItem {
  id: string
  title: string
  handle: string
  description: string
  productType: string
  collections?: {
    edges: ProductListCollectionEdge[]
  }
  featuredImage?: {
    url: string
    altText?: string | null
  } | null
  featuredImageMeta?: {
    url: string
    altText?: string | null
  } | null
  image?: string
  priceRange?: {
    minVariantPrice: {
      amount: string
      currencyCode: string
    }
  }
  compareAtPriceRange?: {
    minVariantPrice: {
      amount: string
      currencyCode: string
    }
  }
  price?: {
    amount: string
    currencyCode: string
  }
  compareAtPrice?: {
    amount: string
    currencyCode: string
  }
  originalPrice?: string
  discount?: {
    amount: string
    percentage: number
  }
  instantDelivery?: boolean
  onSale?: boolean
  featured?: boolean
  tags?: string[]
  gameLogo?: {
    name?: string
    icon?: string
  }
  platform?: string[]
  region?: string[]
  edition?: string[]
  variants?:
    | {
        edges: ProductListVariantEdge[]
      }
    | ProductListVariant[]
  variantOptions?: ProductListVariantOption[][]
}

export interface PageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

export interface GetProductsResponse {
  totalCount?: number
  pageInfo: PageInfo
  products: ProductListItem[]
}
