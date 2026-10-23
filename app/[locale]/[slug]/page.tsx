import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { RedirectService } from '@/lib/services/redirect.service'

import Gallery from '@/components/product/Gallery'
import ProductBuyBar from '@/components/product/ProductBuyBar'
import ProductDescription from '@/components/product/hero-section/ProductDescription'
import ProductDetails from '@/components/product/hero-section/ProductDetails'
import ProductHero, { PRODUCT_CONTAINER_CLASS } from '@/components/product/hero-section/ProductHero'
import WarningBox from '@/components/product/hero-section/WarningBox'
import RatingReviews from '@/components/product/rating-reviews/rating-reviews'
import SimilarGames from '@/components/product/SimilarGames'
import SystemRequirements from '@/components/product/SystemRequirements'
import { ProductService } from '@/lib/services/product.service'
import {
  CmsProductService,
  type CmsProductResult,
} from '@/lib/services/cms-product.service'
import type { Product, ProductListItem } from '@/types/product'
import {
  translateProductPageData,
  getDefaultProductTranslations,
  type ProductPageTranslations,
  type TranslatedProductData,
} from '@/lib/translations/product'
import { reviewService } from '@/lib/services/review.service'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import { generateSeoMetadata } from '@/lib/seo'
import { formatPrice } from '@/lib/currency'
import { stripHtml, localizedHref } from '@/lib/utils'
import { siteUrl } from '@/lib/site'
import {
  ORGANIZATION_ID,
  RETURN_POLICY_ID,
  SHIPPING_SERVICE_ID,
  breadcrumbJsonLd,
  plainText,
} from '@/lib/structured-data'
import type { ProductReview } from '@/types/review'

interface PageProps {
  params: Promise<{
    slug: string
    locale: string
  }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, locale } = await params

  let product: Product | null = null

  try {
    product = await ProductService.getProductByHandle(slug)
  } catch (error) {
    console.error(`Failed to fetch product data for slug: ${slug}`, error)
    return generateSeoMetadata(
      null,
      locale,
      slug,
      'Product Not Found | Increddy',
      'The requested product could not be found.',
    )
  }

  if (!product) {
    return generateSeoMetadata(
      null,
      locale,
      slug,
      'Product Not Found | Increddy',
      'The requested product could not be found.',
    )
  }

  const ogImage =
    product.featuredImage?.url ??
    product.gallery.find((item) => item.type === 'IMAGE')?.url ??
    '/images/product/cover.png'

  const firstVariant = Array.isArray(product.variants)
    ? product.variants[0]
    : product.variants.edges[0]?.node
  const priceEdge = firstVariant?.price
  const formattedPrice = priceEdge
    ? formatPrice(priceEdge.amount, priceEdge.currencyCode)
    : undefined

  const baseMeta = await generateSeoMetadata(
    {
      meta_title: `${product.title} | Increddy`,
      meta_description: stripHtml(product.description),
      keywords: [
        product.title,
        ...product.platform,
        'digital key',
        'instant delivery',
        'game key',
        'buy cheap',
        'Increddy',
      ],
      index: true,
      follow: true,
    },
    locale,
    slug,
    undefined,
    undefined,
    translateTextsWithLangbly,
  )

  const baseOpenGraph = (baseMeta.openGraph ?? {}) as NonNullable<
    Metadata['openGraph']
  >
  const baseTwitter = (baseMeta.twitter ?? {}) as NonNullable<
    Metadata['twitter']
  >

  return {
    ...baseMeta,
    openGraph: {
      ...baseOpenGraph,
      images: [{ url: ogImage, alt: product.title }],
    },
    twitter: {
      ...baseTwitter,
      images: [ogImage],
    },
    other: {
      ...(formattedPrice && { 'product:price:amount': formattedPrice }),
      ...(priceEdge && { 'product:price:currency': priceEdge.currencyCode }),
      'product:availability': product.inStock ? 'in stock' : 'out of stock',
    },
  }
}

// Product + breadcrumb graph for Google's product snippets and merchant listings. Refund and
// delivery rules are the store-wide ones on the organization (lib/structured-data.ts), referenced
// by id. Ratings and reviews are only ever the real ones; an unpriced product gets no Product node
// (Google needs a price), only the breadcrumb.
function getProductJsonLd(
  product: Product,
  locale: string,
  reviews: { summary?: { averageRating?: number; totalReviews?: number }; reviews?: ProductReview[] } | null,
) {
  const url = siteUrl(locale, `/${product.handle}`)
  const variants = Array.isArray(product.variants)
    ? product.variants
    : product.variants.edges.map((edge) => edge.node)
  const variant = variants.find((v) => v.availableForSale) ?? variants[0]
  const isPriced = Boolean(variant) && variant.priced !== false && Number(variant.price?.amount) > 0
  const canBuy = Boolean(variant?.availableForSale) && isPriced

  const images = [
    product.featuredImage?.url,
    ...product.gallery.filter((item) => item.type === 'IMAGE').map((item) => item.url),
  ].filter((src, index, all): src is string => Boolean(src) && /^https?:\/\//.test(src!) && all.indexOf(src) === index)

  const ratingCount = reviews?.summary?.totalReviews ?? 0
  const ratingValue = reviews?.summary?.averageRating ?? 0
  const reviewList = (reviews?.reviews ?? []).filter((r) => r.rating > 0 && (r.body || r.title))

  const breadcrumb = breadcrumbJsonLd(locale, [{ name: 'Store', path: '/store' }, { name: product.title }], url)
  if (!isPriced || images.length === 0) {
    return { '@context': 'https://schema.org', '@graph': [breadcrumb] }
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${url}#product`,
        name: product.title,
        url,
        description: plainText(product.description, 5000) || product.title,
        image: images.slice(0, 10),
        // Same id as the Google Merchant feed (CTX feed g:id), so the two match up.
        sku: variant.id,
        productID: variant.id,
        ...(product.genre?.length && { category: product.genre.join(', ') }),
        ...(ratingCount > 0 &&
          ratingValue > 0 && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: Number(ratingValue.toFixed(1)),
              ratingCount,
              bestRating: 5,
              worstRating: 1,
            },
          }),
        ...(reviewList.length > 0 && {
          review: reviewList.slice(0, 5).map((r) => ({
            '@type': 'Review',
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
            author: { '@type': 'Person', name: r.name || 'Increddy customer' },
            ...(r.createdAt && { datePublished: r.createdAt.slice(0, 10) }),
            ...(r.title && { name: plainText(r.title, 110) }),
            ...(r.body && { reviewBody: plainText(r.body, 1000) }),
          })),
        }),
        offers: {
          '@type': 'Offer',
          url,
          price: Number(variant.price.amount),
          priceCurrency: variant.price.currencyCode || 'USD',
          availability: canBuy ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@id': ORGANIZATION_ID },
          hasMerchantReturnPolicy: { '@id': RETURN_POLICY_ID },
          shippingDetails: { '@type': 'OfferShippingDetails', hasShippingService: { '@id': SHIPPING_SERVICE_ID } },
        },
      },
      breadcrumb,
    ],
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug, locale } = await params

  let product: Product

  try {
    product = await ProductService.getProductByHandle(slug)
  } catch {
    // A renamed product's old URL should land on its new page, not a 404.
    const redirectTarget = await RedirectService.findProductRedirect(slug)
    if (redirectTarget) permanentRedirect(localizedHref(locale, redirectTarget))
    notFound()
  }

  // Run all independent fetches in parallel — none depends on the others
  const [
    recommendationsResult,
    cmsResult,
    reviewsResult,
  ] = await Promise.allSettled([
    ProductService.getProductRecommendations(slug, {
      intent: 'RELATED',
      limit: 8,
    }),
    CmsProductService.getProductCmsData(slug),
    // The newest 5 reviews and the summary, for the structured data (the section loads its own).
    reviewService.getReviews({ productId: product.id, perPage: 5 }),
  ])

  const recommendedProducts: ProductListItem[] =
    recommendationsResult.status === 'fulfilled'
      ? recommendationsResult.value
      : []

  const cmsData: CmsProductResult | null =
    cmsResult.status === 'fulfilled' ? cmsResult.value : null

  const reviewsData = reviewsResult.status === 'fulfilled' ? reviewsResult.value : null
  if (reviewsResult.status === 'rejected') {
    console.error(
      '[ProductPage] Failed to fetch reviews for JSON-LD:',
      reviewsResult.reason,
    )
  }

  // Translate if locale is not English (depends on product, runs after parallel block)
  let labels: ProductPageTranslations = getDefaultProductTranslations()
  let productData: TranslatedProductData | null = null

  if (locale.toUpperCase() !== 'EN') {
    try {
      const result = await translateProductPageData(product, locale)
      labels = result.labels
      productData = result.productData
    } catch (error) {
      console.error('[ProductPage] Translation failed, using defaults:', error)
    }
  }

  const coverImage =
    product.backgroundImage?.url ??
    product.gallery.find((item) => item.type === 'IMAGE')?.url ??
    '/images/product/cover.png'

  const featuredImage =
    product.featuredImage?.url ??
    product.gallery.find((item) => item.type === 'IMAGE')?.url ??
    '/images/product/cover.png'
  const coverAlt =
    product.backgroundImage?.altText ??
    product.featuredImage?.altText ??
    product.gallery.find((item) => item.type === 'IMAGE')?.altText ??
    product.title

  const cmsSystemRequirements = cmsData?.systemRequirements ?? []
  const hasSystemRequirements =
    cmsSystemRequirements.length > 0 || (product.systemRequirements?.length ?? 0) > 0
  const buyLabels = {
    buyNow: labels.buyNow,
    outOfStock: labels.outOfStock,
    notAvailable: labels.notAvailable,
  }

  return (
    <main className="min-h-screen overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            getProductJsonLd(product, locale, reviewsData),
          ),
        }}
      />
      <ProductHero
        product={product}
        coverImage={featuredImage}
        coverAlt={coverAlt}
        backgroundImage={coverImage}
        cmsDropdownOptions={cmsData?.dropdownOptions}
        hasSystemRequirements={hasSystemRequirements}
        labels={{
          instantDeliveryBadge: labels.instantDeliveryBadge,
          onSaleBadge: labels.onSaleBadge,
          reviewCountOne: labels.reviewCountOne,
          reviewCount: labels.reviewCount,
          activationGuide: labels.activationGuide,
          systemRequirements: labels.systemRequirementsHeading,
        }}
        buyPanel={
          <ProductDetails
            product={product}
            cmsDropdownOptions={cmsData?.dropdownOptions}
            locale={locale}
            labels={{
              ...buyLabels,
              soldOutHint: labels.soldOutHint,
              addToWishlist: labels.addToWishlist,
              inWishlist: labels.inWishlist,
              addToCart: labels.addToCart,
            }}
          />
        }
      />

      <div className="flex flex-col gap-16 pt-8 pb-20 md:gap-18 lg:pt-4">
        {product.importantNotice && (
          <div className={PRODUCT_CONTAINER_CLASS}>
            <WarningBox
              warningText={product.importantNotice}
              labels={{ importantNotice: labels.importantNotice }}
            />
          </div>
        )}
        <ProductDescription
          product={product}
          labels={{
            heading: labels.productDescriptionHeading,
            readMore: labels.readMore,
            readLess: labels.readLess,
          }}
          translatedDescription={productData?.description}
          translatedDescriptionHtml={productData?.descriptionHtml}
        />
        <SystemRequirements
          product={product}
          cmsSystemRequirements={cmsSystemRequirements}
          labels={{
            heading: labels.systemRequirementsHeading,
            minimum: labels.minimumSystemRequirements,
            recommended: labels.recommendedSystemRequirements,
          }}
        />
        <Gallery
          featuredImage={featuredImage}
          product={
            cmsData?.gallery?.length
              ? { ...product, gallery: cmsData.gallery }
              : product
          }
          heading={labels.galleryHeading}
        />
        <RatingReviews
          product={product}
          labels={{
            heading: labels.ratingReviewsHeading,
            basedOnOneReview: labels.basedOnOneReview,
            basedOnReviews: labels.basedOnReviews,
            writeAReview: labels.writeAReview,
            writeFirstReview: labels.writeFirstReview,
            failedToLoad: labels.failedToLoadReviews,
            noReviews: labels.noReviewsYet,
            loadMore: labels.loadMoreReviews,
            loading: labels.loadingReviews,
            verifiedPurchase: labels.verifiedPurchase,
            storeReply: labels.storeReply,
            readMore: labels.readMore,
            sortBy: labels.sortBy,
            sortMostRecent: labels.sortMostRecent,
            sortOldest: labels.sortOldest,
            sortHighestRated: labels.sortHighestRated,
            sortLowestRated: labels.sortLowestRated,
          }}
        />
        <SimilarGames
          products={recommendedProducts.filter((item) => item.handle !== slug)}
          title={labels.similarToThis}
        />
      </div>

      <ProductBuyBar product={product} coverImage={featuredImage} labels={buyLabels} />
    </main>
  )
}
