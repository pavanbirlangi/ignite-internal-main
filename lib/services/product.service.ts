import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import medusaClient from '../medusa-axios'
import type {
  Product,
  ProductVariant,
  ProductVariantPrice,
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

// ─── Metadata readers ─────────────────────────────────────────────────────
// instant_delivery/on_sale/featured/platform/region/works_on/genre/edition/
// activation_guide_* all live in product.metadata (confirmed live against the
// real backend, Phase 3) -- there are no dedicated Medusa fields for any of
// these.

function metaBool(metadata: Record<string, unknown> | null | undefined, key: string): boolean {
  return metadata?.[key] === true
}

function metaStringArray(metadata: Record<string, unknown> | null | undefined, key: string): string[] {
  const value = metadata?.[key]
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

function metaString(metadata: Record<string, unknown> | null | undefined, key: string): string | undefined {
  const value = metadata?.[key]
  return typeof value === 'string' && value ? value : undefined
}

// ─── Money mapping ────────────────────────────────────────────────────────
// Medusa v2 stores amounts as decimal major-unit numbers (confirmed Phase 1),
// same convention formatPrice/formatCurrency already expect -- ProductVariantPrice
// just needs the value as a string.

function toVariantPrice(amount: number, currencyCode: string): ProductVariantPrice {
  return { amount: String(amount), currencyCode: currencyCode.toUpperCase() }
}

// Medusa returns tags as `{id, value, ...}` objects, not plain strings.
function mapTags(raw: any): string[] {
  return Array.isArray(raw)
    ? raw.map((t: any) => (typeof t === 'string' ? t : t?.value)).filter(Boolean)
    : []
}

// The activation-guide icon field is free text in Medusa Admin ("URL or icon
// name") -- only pass it through as an <Image> src if it actually looks like
// one, otherwise a bare word like "Steam" crashes next/image's src parser.
function isImageSrc(value: string | undefined): value is string {
  return !!value && (value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://'))
}

interface DigitalAvailability {
  variant_id: string
  is_license_key_product: boolean
  unused_key_count: number
  fulfillment_mode: string | null
}

function mapVariant(
  raw: any,
  digitalAvailability: DigitalAvailability | undefined,
): ProductVariant {
  const calc = raw.calculated_price
  const hasDiscount =
    calc && calc.original_amount > calc.calculated_amount

  const price = calc
    ? toVariantPrice(calc.calculated_amount, calc.currency_code)
    : { amount: '0', currencyCode: 'USD' }

  const compareAtPrice = hasDiscount
    ? toVariantPrice(calc.original_amount, calc.currency_code)
    : null

  const discount = hasDiscount
    ? {
        amount: String(calc.original_amount - calc.calculated_amount),
        percentage: Math.round(
          ((calc.original_amount - calc.calculated_amount) / calc.original_amount) * 100,
        ),
      }
    : null

  const selectedOptions = Array.isArray(raw.options)
    ? raw.options.map((o: any) => ({
        name: o.option?.title ?? '',
        value: o.value ?? '',
      }))
    : []

  const image = raw.thumbnail
    ? { url: raw.thumbnail, altText: raw.title ?? null }
    : { url: '', altText: null }

  // Digital-goods availability (license-key stock), not Medusa's own
  // inventory system -- digital products don't use manage_inventory.
  const availableForSale = digitalAvailability
    ? digitalAvailability.unused_key_count > 0
    : true

  return {
    id: raw.id,
    title: raw.title ?? '',
    price,
    compareAtPrice,
    availableForSale,
    quantityAvailable: digitalAvailability?.unused_key_count ?? 0,
    selectedOptions,
    image,
    discount,
  }
}

async function fetchDigitalAvailability(
  productId: string,
): Promise<Map<string, DigitalAvailability>> {
  try {
    const { data } = await medusaClient.get(
      `/store/products/${productId}/digital-availability`,
    )
    const map = new Map<string, DigitalAvailability>()
    for (const v of data.variants ?? []) {
      map.set(v.variant_id, v)
    }
    return map
  } catch {
    return new Map()
  }
}

async function fetchRatingSummary(
  productId: string,
): Promise<{ average_rating: number; count: number } | null> {
  try {
    const { data } = await medusaClient.get(
      `/store/products/${productId}/reviews`,
      { params: { perPage: 1 } },
    )
    return {
      average_rating: data.average_rating ?? 0,
      count: data.count ?? 0,
    }
  } catch {
    return null
  }
}

function mapProductDetail(
  raw: any,
  digitalAvailability: Map<string, DigitalAvailability>,
  ratingSummary: { average_rating: number; count: number } | null,
): Product {
  const metadata = raw.metadata ?? {}
  const variants = (raw.variants ?? []).map((v: any) =>
    mapVariant(v, digitalAvailability.get(v.id)),
  )
  const firstVariant = variants[0]

  const images = (raw.images ?? []).map((img: any) => ({
    url: img.url,
    altText: raw.title ?? null,
  }))

  const featuredImage = raw.thumbnail
    ? { url: raw.thumbnail, altText: raw.title ?? null }
    : (images[0] ?? null)

  const galleryVideoUrls = metaStringArray(metadata, 'gallery_video_urls')
  const galleryVideos = galleryVideoUrls.map((url) => ({
    type: 'EXTERNAL_VIDEO' as const,
    url,
    host: url.includes('youtu') ? ('YOUTUBE' as const) : undefined,
    altText: null,
  }))

  const backgroundImageUrl = metaString(metadata, 'background_image_url')

  const totalStock = Array.from(digitalAvailability.values()).reduce(
    (sum, v) => sum + v.unused_key_count,
    0,
  )
  const inStock = digitalAvailability.size > 0
    ? totalStock > 0
    : true

  const activationGuideHtml = metaString(metadata, 'activation_guide_html')

  return {
    id: raw.id,
    title: raw.title ?? '',
    handle: raw.handle,
    availableForSale: firstVariant?.availableForSale ?? true,
    totalInventory: totalStock,
    description: raw.description ?? '',
    descriptionHtml: raw.description ?? '',
    images: { edges: images.map((node: any) => ({ node })) },
    gallery: [
      ...images.map((img: any) => ({
        type: 'IMAGE' as const,
        url: img.url,
        altText: img.altText,
      })),
      ...galleryVideos,
    ],
    variants,
    options: (raw.options ?? []).map((o: any) => ({
      name: o.title,
      values: (o.values ?? []).map((v: any) => v.value),
    })),
    instantDelivery: metaBool(metadata, 'instant_delivery'),
    onSale: metaBool(metadata, 'on_sale'),
    featured: metaBool(metadata, 'featured'),
    platform: metaStringArray(metadata, 'platform'),
    region: metaStringArray(metadata, 'region'),
    backgroundImage: backgroundImageUrl
      ? { url: backgroundImageUrl, altText: raw.title ?? null }
      : (images[0] ?? featuredImage),
    featuredImage,
    rating: ratingSummary
      ? { scale_min: '0', scale_max: '5', value: String(ratingSummary.average_rating) }
      : null,
    inStock,
    stockQuantity: totalStock,
    price: firstVariant?.price,
    compareAtPrice: firstVariant?.compareAtPrice ?? null,
    discount: firstVariant?.discount ?? null,
    activationGuide: activationGuideHtml
      ? {
          guide: activationGuideHtml,
          name: metaString(metadata, 'activation_guide_name') ?? '',
          icon: (() => {
            const icon = metaString(metadata, 'activation_guide_icon')
            return isImageSrc(icon) ? icon : null
          })(),
          _type: '',
          _handle: '',
        }
      : undefined,
    tags: mapTags(raw.tags),
    importantNotice: metaString(metadata, 'important_notice'),
  }
}

function mapProductListItem(raw: any): ProductListItem {
  const metadata = raw.metadata ?? {}
  const variants = (raw.variants ?? []).map((v: any) => {
    const calc = v.calculated_price
    return {
      id: v.id,
      title: v.title,
      availableForSale: true,
      selectedOptions: Array.isArray(v.options)
        ? v.options.map((o: any) => ({ name: o.option?.title ?? '', value: o.value ?? '' }))
        : [],
      price: calc ? toVariantPrice(calc.calculated_amount, calc.currency_code) : undefined,
      compareAtPrice:
        calc && calc.original_amount > calc.calculated_amount
          ? toVariantPrice(calc.original_amount, calc.currency_code)
          : undefined,
    }
  })

  const firstCalc = raw.variants?.[0]?.calculated_price
  const hasDiscount = firstCalc && firstCalc.original_amount > firstCalc.calculated_amount

  const price = firstCalc ? toVariantPrice(firstCalc.calculated_amount, firstCalc.currency_code) : undefined
  const compareAtPrice = hasDiscount
    ? toVariantPrice(firstCalc.original_amount, firstCalc.currency_code)
    : undefined

  return {
    id: raw.id,
    title: raw.title ?? '',
    handle: raw.handle,
    description: raw.description ?? '',
    productType: raw.type?.value ?? '',
    collections: raw.collection
      ? { edges: [{ node: { title: raw.collection.title, handle: raw.collection.handle } }] }
      : undefined,
    featuredImage: raw.thumbnail
      ? { url: raw.thumbnail, altText: raw.title ?? null }
      : raw.images?.[0]
        ? { url: raw.images[0].url, altText: raw.title ?? null }
        : null,
    priceRange: price ? { minVariantPrice: price } : undefined,
    compareAtPriceRange: compareAtPrice ? { minVariantPrice: compareAtPrice } : undefined,
    price,
    compareAtPrice,
    discount: hasDiscount
      ? {
          amount: String(firstCalc.original_amount - firstCalc.calculated_amount),
          percentage: Math.round(
            ((firstCalc.original_amount - firstCalc.calculated_amount) / firstCalc.original_amount) * 100,
          ),
        }
      : undefined,
    instantDelivery: metaBool(metadata, 'instant_delivery'),
    onSale: metaBool(metadata, 'on_sale'),
    featured: metaBool(metadata, 'featured'),
    tags: mapTags(raw.tags),
    platform: metaStringArray(metadata, 'platform'),
    region: metaStringArray(metadata, 'region'),
    edition: metaStringArray(metadata, 'edition'),
    variants,
  }
}

// ─── Region resolution ──────────────────────────────────────────────────────
// The `country_code` param this used to pass straight through to Medusa's
// core `/store/products` route turns out not to actually work as pricing
// context -- confirmed live once real per-currency pricing existed to tell
// the difference (Phase 10): `?country_code=in`/`de`/`gb` all silently fail
// to resolve a region (either falling back to the store's default currency
// or returning no price at all), while `?region_id=<real id>` works
// correctly and consistently for every configured region. The
// `country_code` claim in earlier phases' comments was only ever "confirmed"
// back when a single region existed, so a wrong/no-context resolution and a
// correct one looked identical. Fixed here to resolve and pass a real
// `region_id` throughout, via the same shared resolver cart.service.ts uses.
//
// Deliberately returns `undefined` client-side rather than reading a client
// cookie: this function backs the `unstable_cache`-wrapped Server-Component
// fetchers below, and a `'use client'` component calling one of those
// directly already throws a loud, easy-to-catch `incrementalCache missing`
// invariant (see §5 of the migration handoff docs -- this exact crash class
// has already caught four real bugs across Phases 4/5/6/8). Making this
// function quietly "work" client-side would silence that safety net instead
// of fixing the actual mistake. Client code needing region context must use
// one of the explicitly uncached wrappers below, which use
// `getClientRegionId` instead.
const getRegionId = async (): Promise<string | undefined> => {
  if (typeof window !== 'undefined') return undefined
  let country: string | undefined
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    country = cookieStore.get('user_country')?.value?.toLowerCase()
  } catch {
    return undefined
  }
  try {
    const { resolveRegionForCountry } = await import('../utils/region-resolver')
    const region = await resolveRegionForCountry(country)
    return region.id
  } catch {
    return undefined
  }
}

// Client-safe counterpart, used only by the uncached wrappers explicitly
// meant to be called from `'use client'` code (getProductByHandleUncached,
// getRecommendationsByProductId, getProductsByIds). Prefers the region id
// useCurrencyStore already resolved and cached in a cookie, avoiding a
// redundant /store/regions round trip on every product fetch.
const getClientRegionId = async (): Promise<string | undefined> => {
  if (typeof window === 'undefined') return getRegionId()
  const { default: Cookies } = await import('js-cookie')
  const cachedRegionId = Cookies.get('user_region_id')
  if (cachedRegionId) return cachedRegionId
  try {
    const { resolveRegionForCountry } = await import('../utils/region-resolver')
    const region = await resolveRegionForCountry(Cookies.get('user_country'))
    return region.id
  } catch {
    return undefined
  }
}

// ─── Raw fetchers ──────────────────────────────────────────────────────────

const PRODUCT_FIELDS =
  '*variants.calculated_price,+metadata,+images,+options.values,+variants.options.value'

const _fetchProductByHandle = async (
  handle: string,
  regionId?: string,
): Promise<Product> => {
  const { data } = await medusaClient.get('/store/products', {
    params: {
      handle,
      region_id: regionId,
      fields: PRODUCT_FIELDS,
    },
  })

  const raw = data.products?.[0]
  if (!raw) {
    throw new Error(`Invalid product payload for handle: ${handle}`)
  }

  const [digitalAvailability, ratingSummary] = await Promise.all([
    fetchDigitalAvailability(raw.id),
    fetchRatingSummary(raw.id),
  ])

  return mapProductDetail(raw, digitalAvailability, ratingSummary)
}

const _fetchProductRecommendations = async (
  productId: string,
  _params: GetProductRecommendationsParams = {},
  regionId?: string,
): Promise<ProductListItem[]> => {
  // `intent` (related/complementary) is accepted by the backend but not yet
  // differentiated server-side (confirmed live) -- both return the same
  // category-based "related products" list.
  const { data } = await medusaClient.get(
    `/store/products/${productId}/recommendations`,
  )
  // Recommendations route only returns id/title/handle/thumbnail (no price) --
  // enrich with a second call for full list-card data.
  const ids = (data.products ?? []).map((p: any) => p.id)
  if (!ids.length) return []
  return _fetchProductsByIds(ids, regionId)
}

const _fetchProductsByIds = async (
  ids: string[],
  regionId?: string,
): Promise<ProductListItem[]> => {
  if (!ids.length) return []
  const { data } = await medusaClient.get('/store/products', {
    params: {
      id: ids,
      region_id: regionId,
      fields: PRODUCT_FIELDS,
      limit: ids.length,
    },
  })
  return (data.products ?? []).map(mapProductListItem)
}

// ─── Cross-request Next.js Data Cache wrappers (ISR-style, 60s TTL) ──────────

const _cachedGetProductByHandle = unstable_cache(
  async (handle: string, regionId?: string) =>
    _fetchProductByHandle(handle, regionId),
  ['product-by-handle'],
  { revalidate: 60, tags: ['product'] },
)

const _cachedGetProductRecommendations = unstable_cache(
  async (
    productId: string,
    params: GetProductRecommendationsParams = {},
    regionId?: string,
  ) => _fetchProductRecommendations(productId, params, regionId),
  ['product-recommendations'],
  { revalidate: 60, tags: ['product'] },
)

// ─── Per-request React cache deduplication ────────────────────────────────────

const _dedupedGetProductByHandle = cache(
  async (handle: string, regionId?: string) =>
    _cachedGetProductByHandle(handle, regionId),
)

// ─── Public ProductService ───────────────────────────────────────────────────

export const ProductService = {
  /**
   * Rebuilt against `GET /store/products/filtered` (custom route, confirmed
   * live) for category/genre/platform/worksOn/region/edition/instantDelivery/
   * onSale/featured/q filtering + page-based pagination, then enriched with a
   * second call to core `/store/products` for pricing (the filtered route
   * doesn't return prices -- confirmed live).
   *
   * `sortKey`/`reverse` and `minPrice`/`maxPrice` have no backend support yet
   * (no sort param on the filtered route; no promotion/pricing module for
   * price-range filtering -- both confirmed live). Sort is applied
   * client-side on the returned page as a stopgap; price range is a no-op
   * until backend support exists (see MEDUSA_MIGRATION_BACKEND_REQUIREMENTS.md).
   *
   * `after` is repurposed as a plain page-number string (not an opaque
   * cursor) since Medusa's pagination is page-based, not cursor-based.
   */
  getProducts: async (
    params: GetProductsParams,
  ): Promise<GetProductsResponse> => {
    const regionId = await getRegionId()
    const page = params.after ? Number(params.after) : 1
    const limit = params.first ?? 20

    const { data } = await medusaClient.get('/store/products/filtered', {
      params: {
        category: params.category,
        genre: params.genre,
        platform: params.platform,
        works_on: params.worksOn,
        region: params.region,
        edition: params.edition,
        instant_delivery: params.instantDelivery,
        on_sale: params.onSale,
        featured: params.featured,
        q: params.query,
        page,
        limit,
      },
    })

    const ids = (data.products ?? []).map((p: any) => p.id)
    let products = await _fetchProductsByIds(ids, regionId)

    // Preserve the filtered route's order (relevance/recency) rather than
    // whatever order the enrichment call happens to return in.
    const orderIndex = new Map<string, number>(
      ids.map((id: string, i: number) => [id, i]),
    )
    products.sort(
      (a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0),
    )

    if (params.sortKey === 'PRICE') {
      products = [...products].sort((a, b) => {
        const av = Number(a.price?.amount ?? 0)
        const bv = Number(b.price?.amount ?? 0)
        return params.reverse ? bv - av : av - bv
      })
    } else if (params.sortKey === 'TITLE') {
      products = [...products].sort((a, b) =>
        params.reverse ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title),
      )
    }

    const pagination = data.pagination ?? {}
    return {
      totalCount: pagination.total_items ?? products.length,
      pageInfo: {
        hasNextPage: Boolean(pagination.has_next_page),
        endCursor: pagination.has_next_page ? String(page + 1) : null,
      },
      products,
    }
  },

  /** Fetches product by handle. Deduplicated per-request + cached 60s across requests. */
  getProductByHandle: async (handle: string): Promise<Product> => {
    const regionId = await getRegionId()
    return _dedupedGetProductByHandle(handle, regionId)
  },

  /**
   * Same fetch, but for callers that run client-side (e.g. the library
   * reveal modal's activation-guide lookup) -- `unstable_cache` (used by
   * `getProductByHandle` above) is server-only and throws an
   * "incrementalCache missing" invariant if called from the browser
   * (confirmed live: this exact call has been silently failing there since
   * Phase 3, swallowed by an empty catch block). Skips that wrapper.
   */
  getProductByHandleUncached: async (handle: string): Promise<Product> => {
    const regionId = await getClientRegionId()
    return _fetchProductByHandle(handle, regionId)
  },

  /** Fetches product recommendations. Cached 60s across requests. Takes a handle for API-shape continuity but resolves to the product id internally. */
  getProductRecommendations: async (
    handle: string,
    params: GetProductRecommendationsParams = {},
  ): Promise<ProductListItem[]> => {
    const regionId = await getRegionId()
    const product = await _dedupedGetProductByHandle(handle, regionId)
    return _cachedGetProductRecommendations(product.id, params, regionId)
  },

  /**
   * Same recommendations pipeline, but for callers that already have a
   * product id (e.g. cart.service.ts, reading it off a cart line item) and
   * run client-side -- `unstable_cache` (used by `getProductRecommendations`
   * above) is server-only and throws an "incrementalCache missing" invariant
   * if called from the browser (confirmed live). This skips that wrapper.
   */
  getRecommendationsByProductId: async (
    productId: string,
    params: GetProductRecommendationsParams = {},
  ): Promise<ProductListItem[]> => {
    const regionId = await getClientRegionId()
    return _fetchProductRecommendations(productId, params, regionId)
  },

  /**
   * Fetches full list-card data (pricing/variants included) for a known set
   * of product ids, in one call -- e.g. wishlist.service.ts, whose own list
   * route only returns `{id, title, handle, thumbnail}` per product
   * (confirmed live) and needs the same enrichment `getProducts` already
   * does for the store grid. Runs client-side, no cache wrapper involved.
   */
  getProductsByIds: async (ids: string[]): Promise<ProductListItem[]> => {
    const regionId = await getClientRegionId()
    return _fetchProductsByIds(ids, regionId)
  },

  /**
   * Fetches product features. No backend equivalent exists (was folded into
   * product metadata / rating per the migration plan) -- returns null so
   * callers' existing null-handling renders nothing rather than erroring.
   */
  getProductFeatures: async (
    _handle: string,
  ): Promise<ProductFeatures | null> => {
    return null
  },

  getCollectionProductsByHandle: cache(
    async (
      handle: string,
      params: GetCollectionProductsParams = {},
      regionId?: string,
    ): Promise<ProductListItem[]> => {
      const finalRegionId = regionId || (await getRegionId())
      const cachedFn = unstable_cache(
        async (h: string, p: GetCollectionProductsParams, r?: string) => {
          const { data } = await medusaClient.get('/store/products', {
            params: {
              collection_handle: h,
              region_id: r,
              fields: PRODUCT_FIELDS,
              limit: p.first ?? 20,
            },
          })
          return (data.products ?? []).map(mapProductListItem)
        },
        ['collection-products-by-handle'],
        { revalidate: 60, tags: ['collection', 'product'] },
      )
      return cachedFn(handle, params, finalRegionId)
    },
  ),
}
