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
import { getCountryForCurrency } from '@/lib/region-data'
import { formatPrice } from '@/lib/currency'
import { stripHtml, localizedHref } from '@/lib/utils'

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

function getProductJsonLd(
  product: Product,
  locale: string,
  totalReviews?: number,
) {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ||
    'https://increddy.com'
  const firstVariant = Array.isArray(product.variants)
    ? product.variants[0]
    : product.variants.edges[0]?.node
  const price = firstVariant?.price

  const image =
    product.featuredImage?.url ??
    product.gallery.find((item) => item.type === 'IMAGE')?.url ??
    '/images/product/cover.png'

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: stripHtml(product.description),
    image,
    url: `${siteUrl}${localizedHref(locale, `/${product.handle}`)}`,
    brand: {
      '@type': 'Brand',
      name: 'Increddy',
    },
    ...(product.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating.value,
        bestRating: product.rating.scale_max,
        worstRating: product.rating.scale_min,
        ratingCount: Math.max(totalReviews || 0, 1), // Google requires at least 1 if aggregateRating is present
      },
    }),
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}${localizedHref(locale, `/${product.handle}`)}`,
      priceCurrency: price?.currencyCode || 'USD',
      price: price?.amount || '0',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Increddy',
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: getCountryForCurrency(price?.currencyCode || 'USD'),
        returnPolicyCategory:
          'https://schema.org/MerchantReturnPolicyNoReturns',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: price?.currencyCode || 'USD',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: getCountryForCurrency(price?.currencyCode || 'USD'),
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 0,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 0,
            unitCode: 'DAY',
          },
        },
      },
    },
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
    reviewService.getReviews({ productId: product.id, perPage: 1 }),
  ])

  const recommendedProducts: ProductListItem[] =
    recommendationsResult.status === 'fulfilled'
      ? recommendationsResult.value
      : []

  const cmsData: CmsProductResult | null =
    cmsResult.status === 'fulfilled' ? cmsResult.value : null

  let totalReviews = 0
  if (reviewsResult.status === 'fulfilled') {
    totalReviews = reviewsResult.value.summary.totalReviews
  } else {
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
            getProductJsonLd(product, locale, totalReviews),
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
              priceNotFinal: labels.priceNotFinal,
              priceNotFinalTip: labels.priceNotFinalTip,
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
            failedToLoad: labels.failedToLoadReviews,
            noReviews: labels.noReviewsYet,
            loadMore: labels.loadMoreReviews,
            loading: labels.loadingReviews,
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
