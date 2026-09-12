import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import apiClient from '../axios'
import { formatPrice } from '@/lib/currency'
import type {
  Product,
  GetProductsResponse,
  ProductListItem,
} from '@/types/product'

export interface GetProductsParams {
  first?: number
  after?: string
  query?: string
  sortKey?: 'TITLE' | 'PRICE' | 'BEST_SELLING' | 'CREATED_AT'
  reverse?: boolean
  category?: string
  genre?: string
  instantDelivery?: boolean
  onSale?: boolean
  featured?: boolean
  minPrice?: number
  maxPrice?: number
  platform?: string
  worksOn?: string
  edition?: string
  region?: string
}

export interface GetProductRecommendationsParams {
  intent?: 'RELATED' | 'COMPLEMENTARY'
  limit?: number
}

export interface ProductFeatures {
  instantText?: string
  secureText?: string
  rating?: number
  ratingCount?: number
}

export interface GetCollectionProductsParams {
  first?: number
  after?: string
}

const toPriceString = (value: unknown): string | undefined => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const amount = record.amount
    const currencyCode = record.currencyCode

    if (
      (typeof amount === 'string' || typeof amount === 'number') &&
      typeof currencyCode === 'string' &&
      currencyCode.trim()
    ) {
      return formatPrice(amount, currencyCode)
    }

    if (typeof amount === 'string' || typeof amount === 'number') {
      return String(amount)
    }
  }

  return undefined
}

const normalizeRecommendationItem = (item: unknown): ProductListItem | null => {
  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as Record<string, unknown>

  const id = typeof record.id === 'string' ? record.id : ''
  const title = typeof record.title === 'string' ? record.title : ''
  const handle = typeof record.handle === 'string' ? record.handle : ''
  const description =
    typeof record.description === 'string' ? record.description : ''
  const productType =
    typeof record.productType === 'string' ? record.productType : ''

  if (!id || !title || !handle) {
    return null
  }

  const normalized: ProductListItem = {
    id,
    title,
    handle,
    description,
    productType,
    featuredImage:
      record.featuredImage && typeof record.featuredImage === 'object'
        ? (record.featuredImage as ProductListItem['featuredImage'])
        : undefined,
    image: typeof record.image === 'string' ? record.image : undefined,
    priceRange:
      record.priceRange && typeof record.priceRange === 'object'
        ? (record.priceRange as ProductListItem['priceRange'])
        : undefined,
    compareAtPriceRange:
      record.compareAtPriceRange &&
      typeof record.compareAtPriceRange === 'object'
        ? (record.compareAtPriceRange as ProductListItem['compareAtPriceRange'])
        : undefined,
    price: record.price as ProductListItem['price'],
    compareAtPrice: record.compareAtPrice as ProductListItem['compareAtPrice'],
    originalPrice: toPriceString(record.originalPrice),
    discount: record.discount as ProductListItem['discount'],
    instantDelivery:
      typeof record.instantDelivery === 'boolean'
        ? record.instantDelivery
        : undefined,
    onSale: typeof record.onSale === 'boolean' ? record.onSale : undefined,
    featured:
      typeof record.featured === 'boolean' ? record.featured : undefined,
    gameLogo:
      record.gameLogo && typeof record.gameLogo === 'object'
        ? {
            name:
              typeof (record.gameLogo as Record<string, unknown>).name ===
              'string'
                ? ((record.gameLogo as Record<string, unknown>).name as string)
                : undefined,
            icon:
              typeof (record.gameLogo as Record<string, unknown>).icon ===
              'string'
                ? ((record.gameLogo as Record<string, unknown>).icon as string)
                : undefined,
          }
        : undefined,
    tags: Array.isArray(record.tags)
      ? record.tags.filter((tag): tag is string => typeof tag === 'string')
      : undefined,
    platform: Array.isArray(record.platform)
      ? record.platform.filter(
          (platform): platform is string => typeof platform === 'string',
        )
      : undefined,
    region: Array.isArray(record.region)
      ? record.region.filter(
          (region): region is string => typeof region === 'string',
        )
      : undefined,
    edition: Array.isArray(record.edition)
      ? record.edition.filter(
          (edition): edition is string => typeof edition === 'string',
        )
      : undefined,
    variants:
      Array.isArray(record.variants) ||
      (record.variants && typeof record.variants === 'object')
        ? (record.variants as ProductListItem['variants'])
        : undefined,
    variantOptions: Array.isArray(record.variantOptions)
      ? (record.variantOptions as ProductListItem['variantOptions'])
      : undefined,
  }

  return normalized
}

const normalizeProductListPayload = (payload: unknown): ProductListItem[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizeRecommendationItem(item))
      .filter((item): item is ProductListItem => Boolean(item))
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const list = record.products ?? record.recommendations ?? record.data

    if (Array.isArray(list)) {
      return list
        .map((item) => normalizeRecommendationItem(item))
        .filter((item): item is ProductListItem => Boolean(item))
    }
  }

  return []
}

const normalizeProductPayload = (payload: unknown): Product | null => {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const candidate = (record.product ?? record.data ?? payload) as unknown

    if (candidate && typeof candidate === 'object') {
      const product = candidate as Record<string, unknown>
      if (
        typeof product.id === 'string' &&
        typeof product.title === 'string' &&
        typeof product.handle === 'string'
      ) {
        return candidate as Product
      }
    }
  }

  return null
}

// ─── Raw fetchers (used by cached wrappers below) ────────────────────────────

const _fetchProductByHandle = async (
  handle: string,
  country?: string,
): Promise<Product> => {
  const response = await apiClient.get(`/products/${handle}`, {
    params: country ? { country } : {},
  })
  const product = normalizeProductPayload(response.data as unknown)

  if (!product) {
    throw new Error(`Invalid product payload for handle: ${handle}`)
  }

  return product
}

const _fetchProductRecommendations = async (
  handle: string,
  params: GetProductRecommendationsParams = {},
  country?: string,
): Promise<ProductListItem[]> => {
  const response = await apiClient.get(`/products/${handle}/recommendations`, {
    params: { ...params, country },
  })
  return normalizeProductListPayload(response.data as unknown)
}

const _fetchProductFeatures = async (
  handle: string,
): Promise<ProductFeatures | null> => {
  try {
    const response = await apiClient.get<ProductFeatures>(`/products/${handle}/features`)
    return response.data
  } catch {
    return null
  }
}


// ─── Cross-request Next.js Data Cache wrappers (ISR-style, 60s TTL) ──────────

const _cachedGetProductByHandle = unstable_cache(
  async (handle: string, country?: string) =>
    _fetchProductByHandle(handle, country),
  ['product-by-handle'],
  { revalidate: 60, tags: ['product'] },
)

const _cachedGetProductRecommendations = unstable_cache(
  async (
    handle: string,
    params: GetProductRecommendationsParams = {},
    country?: string,
  ) => _fetchProductRecommendations(handle, params, country),
  ['product-recommendations'],
  { revalidate: 60, tags: ['product'] },
)

const _cachedGetProductFeatures = unstable_cache(
  async (handle: string) => _fetchProductFeatures(handle),
  ['product-features'],
  { revalidate: 60, tags: ['product', 'features'] },
)

// ─── Per-request React cache deduplication ────────────────────────────────────
// Wraps the cross-request cache so that within a single server render
// (e.g. generateMetadata + ProductPage both calling getProductByHandle)
// the underlying fetch is only executed once.

const _dedupedGetProductByHandle = cache(
  async (handle: string, country?: string) =>
    _cachedGetProductByHandle(handle, country),
)

// ─── Public ProductService ───────────────────────────────────────────────────

const getCountryCode = async () => {
  if (typeof window !== 'undefined') return undefined
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    return cookieStore.get('user_country')?.value
  } catch {
    return undefined
  }
}

export const ProductService = {
  getProducts: async (
    params: GetProductsParams,
  ): Promise<GetProductsResponse> => {
    const response = await apiClient.get<GetProductsResponse>('/products', {
      params,
    })
    return response.data
  },

  /** Fetches product by handle. Deduplicated per-request + cached 60s across requests. */
  getProductByHandle: async (handle: string): Promise<Product> => {
    const country = await getCountryCode()
    return _dedupedGetProductByHandle(handle, country)
  },

  /** Fetches product recommendations. Cached 60s across requests. */
  getProductRecommendations: async (
    handle: string,
    params: GetProductRecommendationsParams = {},
  ): Promise<ProductListItem[]> => {
    const country = await getCountryCode()
    return _cachedGetProductRecommendations(handle, params, country)
  },

  /** Fetches product features. Cached 60s across requests. */
  getProductFeatures: async (
    handle: string,
  ): Promise<ProductFeatures | null> => {
    return _cachedGetProductFeatures(handle)
  },

  getCollectionProductsByHandle: cache(
    async (
      handle: string,
      params: GetCollectionProductsParams = {},
      country?: string,
    ): Promise<ProductListItem[]> => {
      const finalCountry = country || (await getCountryCode())
      const cachedFn = unstable_cache(
        async (h: string, p: GetCollectionProductsParams, c?: string) => {
          const response = await apiClient.get(`/collections/${h}/products`, {
            params: { ...p, country: c },
          })
          return normalizeProductListPayload(response.data as unknown)
        },
        ['collection-products-by-handle'],
        { revalidate: 60, tags: ['collection', 'product'] },
      )
      return cachedFn(handle, params, finalCountry)
    },
  ),
}
