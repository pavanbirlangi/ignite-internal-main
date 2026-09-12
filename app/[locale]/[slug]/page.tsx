import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'

import Gallery from '@/components/product/Gallery'
import FeatureRow from '@/components/product/hero-section/feature-row'
import ProductDescription from '@/components/product/hero-section/ProductDescription'
import ProductDetails from '@/components/product/hero-section/ProductDetails'
import ProductImage from '@/components/product/hero-section/ProductImage'
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
import { getProxyImageUrl } from '@/lib/utils'

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
      meta_description: product.description,
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
    description: product.description,
    image,
    url: `${siteUrl}/${locale.toLowerCase()}/${product.handle}`,
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
      url: `${siteUrl}/${locale.toLowerCase()}/${product.handle}`,
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
    notFound()
  }

  // Run all independent fetches in parallel — none depends on the others
  const [recommendationsResult, cmsResult, reviewsResult, featuresResult] =
    await Promise.allSettled([
      ProductService.getProductRecommendations(slug, {
        intent: 'RELATED',
        limit: 8,
      }),
      CmsProductService.getProductCmsData(slug),
      reviewService.getReviews({ handle: slug, perPage: 1 }),
      ProductService.getProductFeatures(slug),
    ])

  const recommendedProducts: ProductListItem[] =
    recommendationsResult.status === 'fulfilled'
      ? recommendationsResult.value
      : []

  const cmsData: CmsProductResult | null =
    cmsResult.status === 'fulfilled' ? cmsResult.value : null

  const featuresData =
    featuresResult.status === 'fulfilled' ? featuresResult.value : null

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

      if (featuresData) {
        const textsToTranslate = []
        if (featuresData.instantText) textsToTranslate.push(featuresData.instantText)
        if (featuresData.secureText) textsToTranslate.push(featuresData.secureText)
        
        if (textsToTranslate.length > 0) {
          const translatedFeatures = await translateTextsWithLangbly(textsToTranslate, locale)
          
          let i = 0
          if (featuresData.instantText) featuresData.instantText = translatedFeatures[i++]
          if (featuresData.secureText) featuresData.secureText = translatedFeatures[i++]
        }
      }
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

  return (
    <main className="min-h-screen overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            getProductJsonLd(product, locale, totalReviews),
          ),
        }}
      />
      {/* Background Hero Image */}
      <div className="absolute top-0 left-0 z-0 h-[300px] w-full md:h-[420px]">
        <div className="h-full w-full shadow-[inset_0px_102px_105px_0px_var(--black-90)]">
          <Image
            src={getProxyImageUrl(coverImage)}
            alt={`${product.title} background`}
            fill
            className="object-cover object-top"
            priority
          />
        </div>
      </div>

      <div className="relative z-10">
        {/* Main Content Container */}
        <div className="mx-auto flex max-w-[950px] flex-col gap-6 px-4 pt-20 pb-16 md:pt-32 md:pb-20">
          <div className="flex flex-col items-start gap-8 md:flex-row lg:h-[480px]">
            {/* Left Column (Image) */}
            <div className="mx-auto flex h-[330px] w-[230px] shrink-0 flex-col gap-4 lg:h-full lg:w-auto">
              <ProductImage src={featuredImage} alt={coverAlt} />
            </div>

            {/* Right Column (Details + Features) */}
            <div className="flex w-full flex-col gap-[20px] md:gap-[27px] lg:h-full">
              <ProductDetails
                product={product}
                cmsDropdownOptions={cmsData?.dropdownOptions}
                locale={locale}
                labels={{
                  instantDeliveryBadge: labels.instantDeliveryBadge,
                  onSaleBadge: labels.onSaleBadge,
                  digitalKeyBadge: labels.digitalKeyBadge,
                  activationGuide: labels.activationGuide,
                  inStock: labels.inStock,
                  outOfStock: labels.outOfStock,
                  digitalDownload: labels.digitalDownload,
                  buyNow: labels.buyNow,
                }}
              />
              <FeatureRow
                product={product}
                features={featuresData}
                labels={{
                  instant: labels.instant,
                  delivery: labels.delivery,
                  secure: labels.secure,
                }}
              />
            </div>
          </div>
          {product.importantNotice && (
            <WarningBox
              warningText={product.importantNotice}
              labels={{
                importantNotice: labels.importantNotice,
                warningText: labels.warningText,
              }}
            />
          )}
        </div>
      </div>

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
        cmsSystemRequirements={cmsData?.systemRequirements}
        labels={{
          heading: labels.systemRequirementsHeading,
          minimum: labels.minimumSystemRequirements,
          recommended: labels.recommendedSystemRequirements,
        }}
      />
      <Gallery featuredImage={featuredImage} product={product} heading={labels.galleryHeading} />
      <RatingReviews
        product={product}
        labels={{
          heading: labels.ratingReviewsHeading,
          outOf5: labels.outOf5,
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
    </main>
  )
}
