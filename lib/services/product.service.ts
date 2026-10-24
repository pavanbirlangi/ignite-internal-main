import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import medusaClient from '../medusa-axios'
import { DEFAULT_CURRENCY, getDisplayCurrency } from '../utils/display-currency'
import { getCurrencyConverter } from './display-currency.service'
import { getDiscountPercent } from '@/lib/utils/discount'
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
  allow_backorder?: boolean
  purchasable?: boolean
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
        percentage: getDiscountPercent(calc.original_amount, calc.calculated_amount),
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
  // inventory system -- digital products don't use manage_inventory. A key
  // product with no unused keys left can still be bought when the admin allows
  // backorders: the order then waits in the manual key-assignment queue. The
  // backend's `purchasable` already combines both; the fallback covers a
  // response without it. A variant with no price can't be bought at all.
  const purchasable =
    digitalAvailability?.purchasable ??
    (!digitalAvailability ||
      !digitalAvailability.is_license_key_product ||
      digitalAvailability.unused_key_count > 0 ||
      raw.allow_backorder === true)
  const availableForSale = Boolean(calc) && purchasable

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
    priced: Boolean(calc),
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

// Stock for many products in one call (`GET /store/digital-availability`, up to 100 ids per
// request), keyed by variant id. Products the call can't answer are left out, so callers keep
// their default.
async function fetchDigitalAvailabilityBatch(
  productIds: string[],
): Promise<Map<string, DigitalAvailability>> {
  const map = new Map<string, DigitalAvailability>()
  const ids = [...new Set(productIds.filter(Boolean))]
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100))
  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const { data } = await medusaClient.get('/store/digital-availability', {
          params: { product_id: chunk.join(',') },
        })
        for (const product of data.products ?? []) {
          for (const v of product.variants ?? []) map.set(v.variant_id, v)
        }
      } catch {
        // Unknown stock: the cards and cart keep treating the product as buyable.
      }
    }),
  )
  return map
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

interface SharedActivationGuide {
  id: string
  name: string
  icon_url: string | null
  html: string
  external_link: string | null
}

const ACTIVATION_GUIDES_TTL_MS = 5 * 60 * 1000
let activationGuidesCache: {
  expiresAt: number
  promise: Promise<Map<string, SharedActivationGuide>>
} | null = null

// The whole guide library is tiny (one entry per platform/storefront), so it's fetched once
// and shared by every product rather than looked up per product.
function getActivationGuides(): Promise<Map<string, SharedActivationGuide>> {
  if (activationGuidesCache && activationGuidesCache.expiresAt > Date.now()) {
    return activationGuidesCache.promise
  }
  const promise = medusaClient
    .get('/store/activation-guides')
    .then(({ data }) => {
      const guides: SharedActivationGuide[] = data.guides ?? []
      return new Map(guides.map((g) => [g.id, g]))
    })
    .catch(() => {
      activationGuidesCache = null
      return new Map<string, SharedActivationGuide>()
    })
  activationGuidesCache = { expiresAt: Date.now() + ACTIVATION_GUIDES_TTL_MS, promise }
  return promise
}

async function fetchActivationGuide(
  guideId: string | undefined,
): Promise<SharedActivationGuide | null> {
  if (!guideId) return null
  return (await getActivationGuides()).get(guideId) ?? null
}

// The platform as the product page's facts line shows it: the product's `platform` metadata (or
// its guide's name) with the shared activation guide's icon. Used by the cart rows.
// Each product's platform and activation guide, by product id: for the keys PDF, which knows the
// order's products only by id. The platform name comes from the guide when there is one (the
// product's own platform field isn't consistently capitalised).
export async function getProductsActivationInfo(
  productIds: string[],
): Promise<Map<string, { platform: string | null; guide: { name: string; html: string } | null }>> {
  const ids = [...new Set(productIds.filter(Boolean))]
  const info = new Map<string, { platform: string | null; guide: { name: string; html: string } | null }>()
  if (!ids.length) return info
  const { data } = await medusaClient.get('/store/products', {
    params: { id: ids, fields: 'id,metadata', limit: ids.length },
  })
  await Promise.all(
    ((data.products ?? []) as { id: string; metadata?: Record<string, unknown> | null }[]).map(async (raw) => {
      const metadata = raw.metadata ?? {}
      const guide = await fetchActivationGuide(metaString(metadata, 'activation_guide_id'))
      const platform =
        guide?.name || metaStringArray(metadata, 'platform')[0] || metaString(metadata, 'activation_guide_name') || null
      info.set(raw.id, {
        platform,
        guide: guide?.html ? { name: guide.name, html: guide.html } : null,
      })
    }),
  )
  return info
}

export async function resolveProductPlatform(
  metadata: Record<string, unknown> | null | undefined,
): Promise<{ name: string; icon: string | null } | null> {
  const guide = await fetchActivationGuide(metaString(metadata, 'activation_guide_id'))
  const name =
    metaStringArray(metadata, 'platform')[0] || guide?.name || metaString(metadata, 'activation_guide_name')
  if (!name) return null
  return { name, icon: guide?.icon_url || metaString(metadata, 'activation_guide_icon') || null }
}

function mapProductDetail(
  raw: any,
  digitalAvailability: Map<string, DigitalAvailability>,
  ratingSummary: { average_rating: number; count: number } | null,
  sharedGuide: SharedActivationGuide | null,
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
  const inStock =
    variants.length === 0 || variants.some((v: ProductVariant) => v.availableForSale)

  // Products now point at a shared guide via `activation_guide_id`; the old per-product
  // fields are only a fallback for products that haven't been migrated to the library.
  const activationGuideHtml =
    sharedGuide?.html || metaString(metadata, 'activation_guide_html')
  const activationGuideName =
    sharedGuide?.name || metaString(metadata, 'activation_guide_name')
  const activationGuideLink =
    sharedGuide?.external_link || metaString(metadata, 'activation_guide_link')
  // Guarded because this field was free text before it became a real file
  // upload -- a leftover non-URL value like "Steam" crashes next/image's src
  // parser outright (this is what R-24 was raised for).
  const activationGuideIconRaw =
    sharedGuide?.icon_url || metaString(metadata, 'activation_guide_icon')
  const activationGuideIcon = isImageSrc(activationGuideIconRaw)
    ? activationGuideIconRaw
    : null

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
    worksOn: metaStringArray(metadata, 'works_on'),
    genre: metaStringArray(metadata, 'genre'),
    backgroundImage: backgroundImageUrl
      ? { url: backgroundImageUrl, altText: raw.title ?? null }
      : (images[0] ?? featuredImage),
    featuredImage,
    // No rating until a review exists, so the page (and the JSON-LD) never shows a 0 rating.
    rating: ratingSummary && ratingSummary.count > 0
      ? { scale_min: '0', scale_max: '5', value: String(ratingSummary.average_rating) }
      : null,
    ratingCount: ratingSummary?.count ?? 0,
    inStock,
    stockQuantity: totalStock,
    price: firstVariant?.price,
    compareAtPrice: firstVariant?.compareAtPrice ?? null,
    discount: firstVariant?.discount ?? null,
    // Built when *any* of the three fields is filled, not only when the HTML
    // is -- these are three independent admin inputs and a product can
    // legitimately have a name/icon before anyone writes the guide body
    // (confirmed live: a real product had `activation_guide_name` and an icon
    // set with no HTML, and the old all-or-nothing guard threw both away).
    // Each part is rendered conditionally downstream instead.
    activationGuide: activationGuideName || activationGuideIcon || activationGuideHtml || activationGuideLink
      ? {
          guide: activationGuideHtml,
          name: activationGuideName ?? '',
          icon: activationGuideIcon,
          link: activationGuideLink,
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
  const gameLogoUrl = metaString(metadata, 'game_logo_url')
  const variants = (raw.variants ?? []).map((v: any) => {
    const calc = v.calculated_price
    return {
      id: v.id,
      title: v.title,
      // Set by attachListStock below; a variant it couldn't check stays buyable.
      availableForSale: v.purchasable ?? true,
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
          percentage: getDiscountPercent(firstCalc.original_amount, firstCalc.calculated_amount),
        }
      : undefined,
    instantDelivery: metaBool(metadata, 'instant_delivery'),
    onSale: metaBool(metadata, 'on_sale'),
    featured: metaBool(metadata, 'featured'),
    tags: mapTags(raw.tags),
    // Admin-uploaded per-product card icon (matched the original Shopify
    // behavior, confirmed directly by the user) -- not a platform lookup.
    // `game_logo_url` doesn't exist on the backend yet (see
    // MEDUSA_MIGRATION_BACKEND_REQUIREMENTS.md), so this reads as `undefined`
    // for every product today; ready to pick it up the moment that field and
    // its admin upload control exist, same pattern as `background_image_url`.
    gameLogo: gameLogoUrl ? { icon: gameLogoUrl, name: raw.title ?? '' } : undefined,
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
// getRecommendationsByProductId, getProductsByIds). Deliberately doesn't trust
// the old `user_region_id` cookie: returning visitors can still carry one from
// a region that no longer exists, and the region list is cached anyway.
const getClientRegionId = async (): Promise<string | undefined> => {
  if (typeof window === 'undefined') return getRegionId()
  const { default: Cookies } = await import('js-cookie')
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
  '*variants.calculated_price,+metadata,+images,+options.values,+variants.options.value,+variants.allow_backorder'

// List cards show "Out of stock" when a variant can't be bought. The backend's `purchasable` is
// the one answer (an unused key, "Allow backorders", and a USD price all count), so one batch
// call asks for every listed product. Sets `purchasable` on each raw variant for
// mapProductListItem; a product the call can't answer keeps the default (buyable).
type StockCheckProduct = {
  id: string
  variants?: { id: string; allow_backorder?: boolean; purchasable?: boolean }[]
}

async function attachListStock(rawProducts: StockCheckProduct[]): Promise<void> {
  const listed = rawProducts.filter((p) => p?.id && (p.variants ?? []).length > 0)
  if (listed.length === 0) return
  const availability = await fetchDigitalAvailabilityBatch(listed.map((p) => p.id))
  for (const product of listed) {
    for (const variant of product.variants ?? []) {
      const purchasable = availability.get(variant.id)?.purchasable
      if (typeof purchasable === 'boolean') variant.purchasable = purchasable
    }
  }
}

// Products are priced in USD only; prices in the visitor's display currency are the USD amounts
// times the admin-managed exchange rate (display-currency.service.ts), applied to each raw
// variant's `calculated_price` before mapping so every downstream price (cards, product page,
// sale/compare-at, discount %) is converted the same way. A variant with no price stays unpriced.
async function convertDisplayPrices(rawProducts: any[], currency: string): Promise<void> {
  const converter = await getCurrencyConverter(DEFAULT_CURRENCY, currency)
  if (converter.currencyCode === DEFAULT_CURRENCY) return
  for (const product of rawProducts) {
    for (const variant of product?.variants ?? []) {
      const calc = variant?.calculated_price
      if (!calc || calc.currency_code?.toLowerCase() !== DEFAULT_CURRENCY) continue
      variant.calculated_price = {
        ...calc,
        calculated_amount: converter.convert(Number(calc.calculated_amount)),
        original_amount: converter.convert(Number(calc.original_amount ?? calc.calculated_amount)),
        currency_code: converter.currencyCode,
      }
    }
  }
}

// A product with no price can't be added to a cart -- listing it would show "0.00" with an add
// button that fails, so list views leave it out until the admin prices it.
const hasPrice = (product: ProductListItem) => Boolean(product.price)

const _fetchProductByHandle = async (
  handle: string,
  regionId: string | undefined,
  currency: string,
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
  await convertDisplayPrices([raw], currency)

  const [digitalAvailability, ratingSummary, sharedGuide] = await Promise.all([
    fetchDigitalAvailability(raw.id),
    fetchRatingSummary(raw.id),
    fetchActivationGuide(metaString(raw.metadata, 'activation_guide_id')),
  ])

  return mapProductDetail(raw, digitalAvailability, ratingSummary, sharedGuide)
}

const _fetchProductRecommendations = async (
  productId: string,
  _params: GetProductRecommendationsParams = {},
  regionId: string | undefined,
  currency: string,
): Promise<ProductListItem[]> => {
  // `intent` (related/complementary) is accepted by the backend but not yet
  // differentiated server-side (confirmed live) -- both return the same
  // category-based "related products" list.
  const { data } = await medusaClient.get(
    `/store/products/${productId}/recommendations`,
  )
  // Recommendations route only returns id/title/handle/thumbnail (no price) --
  // enrich with a second call for full list-card data.
  const ids: string[] = (data.products ?? []).map((p: any) => p.id)
  if (!ids.length) return []
  // `/store/products?id=` answers in its own order, not the one asked for; put the products back
  // in the backend's order so the admin's upsell picks come first, in the order the admin set.
  const position = new Map(ids.map((id, index) => [id, index]))
  const products = await _fetchProductsByIds(ids, regionId, currency)
  return products.sort((a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0))
}

const _fetchProductsByIds = async (
  ids: string[],
  regionId: string | undefined,
  currency: string,
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
  const rawProducts = data.products ?? []
  await Promise.all([convertDisplayPrices(rawProducts, currency), attachListStock(rawProducts)])
  return rawProducts.map(mapProductListItem).filter(hasPrice)
}

// ─── Cross-request Next.js Data Cache wrappers (ISR-style, 60s TTL) ──────────

const _cachedGetProductByHandle = unstable_cache(
  async (handle: string, regionId: string | undefined, currency: string) =>
    _fetchProductByHandle(handle, regionId, currency),
  ['product-by-handle'],
  { revalidate: 60, tags: ['product'] },
)

const _cachedGetProductRecommendations = unstable_cache(
  async (
    productId: string,
    params: GetProductRecommendationsParams = {},
    regionId: string | undefined,
    currency: string,
  ) => _fetchProductRecommendations(productId, params, regionId, currency),
  ['product-recommendations'],
  { revalidate: 60, tags: ['product'] },
)

// ─── Per-request React cache deduplication ────────────────────────────────────

const _dedupedGetProductByHandle = cache(
  async (handle: string, regionId: string | undefined, currency: string) =>
    _cachedGetProductByHandle(handle, regionId, currency),
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
    // Client-safe resolver, not getRegionId() -- confirmed live that this is
    // called exclusively from the browser (hooks/useProducts.ts, a React
    // Query hook backing the store grid), so getRegionId() always returned
    // undefined here, silently dropping region context and making every
    // store-grid card show the store's default-region price regardless of
    // the customer's actual selected currency.
    const regionId = await getClientRegionId()
    const currency = await getDisplayCurrency()
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
    let products = await _fetchProductsByIds(ids, regionId, currency)

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
    return _dedupedGetProductByHandle(handle, regionId, await getDisplayCurrency())
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
    return _fetchProductByHandle(handle, regionId, await getDisplayCurrency())
  },

  /** Fetches product recommendations. Cached 60s across requests. Takes a handle for API-shape continuity but resolves to the product id internally. */
  getProductRecommendations: async (
    handle: string,
    params: GetProductRecommendationsParams = {},
  ): Promise<ProductListItem[]> => {
    const regionId = await getRegionId()
    const currency = await getDisplayCurrency()
    const product = await _dedupedGetProductByHandle(handle, regionId, currency)
    return _cachedGetProductRecommendations(product.id, params, regionId, currency)
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
    return _fetchProductRecommendations(productId, params, regionId, await getDisplayCurrency())
  },

  /**
   * Fetches full list-card data (pricing/variants included) for a known set
   * of product ids, in one call -- e.g. wishlist.service.ts, whose own list
   * route only returns `{id, title, handle, thumbnail}` per product
   * (confirmed live) and needs the same enrichment `getProducts` already
   * does for the store grid. Runs client-side, no cache wrapper involved.
   */
  /**
   * Whether each variant of these products can be bought right now, and how many at most
   * (`limit`: the unused keys of a key product without backorders, otherwise null), keyed by
   * variant id (`GET /store/digital-availability`). Used by the cart.
   */
  getVariantStock: async (
    productIds: string[],
  ): Promise<Record<string, { purchasable: boolean; limit: number | null }>> => {
    const availability = await fetchDigitalAvailabilityBatch(productIds)
    return Object.fromEntries(
      [...availability]
        .filter(([, v]) => typeof v.purchasable === 'boolean')
        .map(([variantId, v]) => [
          variantId,
          {
            purchasable: v.purchasable as boolean,
            limit: v.is_license_key_product && !v.allow_backorder ? v.unused_key_count : null,
          },
        ]),
    )
  },

  getProductsByIds: async (ids: string[]): Promise<ProductListItem[]> => {
    const regionId = await getClientRegionId()
    return _fetchProductsByIds(ids, regionId, await getDisplayCurrency())
  },

  getCollectionProductsByHandle: cache(
    async (
      handle: string,
      params: GetCollectionProductsParams = {},
      regionId?: string,
    ): Promise<ProductListItem[]> => {
      const finalRegionId = regionId || (await getRegionId())
      const currency = await getDisplayCurrency()
      const cachedFn = unstable_cache(
        async (h: string, p: GetCollectionProductsParams, r: string | undefined, cur: string) => {
          // core /store/products doesn't accept a `collection_handle` filter
          // at all on this backend -- confirmed live, it 400s with
          // "Unrecognized fields: 'collection_handle'". Every homepage
          // "product_recommendations" carousel (Featured Deals, Top Rated
          // Games, Recommended for You) was silently rendering empty because
          // of this, caught by the homepage page's own catch-and-fall-back-
          // to-[] handling. Resolving the handle to a real collection id
          // first and filtering by that instead is what actually works.
          const { data: collectionData } = await medusaClient.get(
            '/store/collections',
            { params: { handle: h } },
          )
          const collectionId = collectionData.collections?.[0]?.id
          if (!collectionId) return []

          const { data } = await medusaClient.get('/store/products', {
            params: {
              collection_id: [collectionId],
              region_id: r,
              fields: PRODUCT_FIELDS,
              limit: p.first ?? 20,
            },
          })
          const rawProducts = data.products ?? []
          await Promise.all([convertDisplayPrices(rawProducts, cur), attachListStock(rawProducts)])
          return rawProducts.map(mapProductListItem).filter(hasPrice)
        },
        ['collection-products-by-handle'],
        { revalidate: 60, tags: ['collection', 'product'] },
      )
      return cachedFn(handle, params, finalRegionId, currency)
    },
  ),
}
