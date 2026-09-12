export interface ShopifyImage {
  url: string
  altText?: string | null
}

export interface ShopifyPrice {
  amount: string
  currencyCode: string
}

export interface ShopifyPriceRange {
  minVariantPrice: ShopifyPrice
}

export interface ShopifyCollectionNode {
  title: string
  handle: string
}

export interface ShopifyCollectionEdge {
  node: ShopifyCollectionNode
}

export interface ShopifyCollections {
  edges: ShopifyCollectionEdge[]
}

export interface Product {
  id: string
  title: string
  handle: string
  description: string
  productType: string
  collections?: ShopifyCollections
  featuredImage?: ShopifyImage
  image?: string // fallback
  priceRange?: ShopifyPriceRange
  price?: string // fallback
  originalPrice?: string // optional 
  discount?: string // optional
  instantDelivery?: boolean
  onSale?: boolean
  featured?: boolean
  platform?: string[]
}

export interface FilterOption {
  id: string
  label: string
}

export type SortOption = 'price-low-high' | 'price-high-low' | 'newest' | 'popularity'
