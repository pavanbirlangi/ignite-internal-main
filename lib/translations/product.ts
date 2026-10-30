import { unstable_cache } from 'next/cache'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import type { Product } from '@/types/product'

/**
 * All translatable UI labels for the product page.
 */
export interface ProductPageTranslations {
  // Hero
  instantDeliveryBadge: string
  onSaleBadge: string
  reviewCountOne: string
  reviewCount: string
  activationGuide: string
  // Buy panel and buy bar
  buyNow: string
  addToCart: string
  outOfStock: string
  notAvailable: string
  soldOutHint: string
  addToWishlist: string
  inWishlist: string
  // ProductDescription component
  productDescriptionHeading: string
  readMore: string
  readLess: string
  // Details panel beside the description
  detailsHeading: string
  detailsPublisher: string
  detailsDeveloper: string
  detailsReleaseDate: string
  detailsLanguages: string
  detailsAgeRating: string
  detailsDelivery: string
  detailsDeliveryInstant: string
  detailsDeliveryStandard: string
  detailsActivation: string
  detailsHowToActivate: string
  // WarningBox
  importantNotice: string
  // SystemRequirements
  systemRequirementsHeading: string
  minimumSystemRequirements: string
  recommendedSystemRequirements: string
  // SimilarGames
  similarToThis: string
  // Gallery
  galleryHeading: string
  // RatingReviews
  ratingReviewsHeading: string
  basedOnOneReview: string
  basedOnReviews: string
  writeAReview: string
  writeFirstReview: string
  failedToLoadReviews: string
  noReviewsYet: string
  loadMoreReviews: string
  loadingReviews: string
  verifiedPurchase: string
  storeReply: string
  sortBy: string
  sortMostRecent: string
  sortOldest: string
  sortHighestRated: string
  sortLowestRated: string
}

const defaultLabels: ProductPageTranslations = {
  instantDeliveryBadge: 'Instant delivery',
  onSaleBadge: 'On sale',
  reviewCountOne: '(1 review)',
  reviewCount: '({count} reviews)',
  activationGuide: 'Activation guide',
  buyNow: 'Buy now',
  addToCart: 'Add to cart',
  outOfStock: 'Out of stock',
  notAvailable: 'Not available',
  soldOutHint: 'This key is sold out right now. Save it to your wishlist to find it again.',
  addToWishlist: 'Add to wishlist',
  inWishlist: 'In your wishlist',
  productDescriptionHeading: 'About this game',
  readMore: 'Read more',
  readLess: 'Read less',
  detailsHeading: 'Details',
  detailsPublisher: 'Publisher',
  detailsDeveloper: 'Developer',
  detailsReleaseDate: 'Release date',
  detailsLanguages: 'Languages',
  detailsAgeRating: 'Age rating',
  detailsDelivery: 'Delivery',
  detailsDeliveryInstant: 'Instant, by email and in My Library',
  detailsDeliveryStandard: 'By email and in My Library',
  detailsActivation: 'Activation',
  detailsHowToActivate: 'How to activate',
  importantNotice: 'Important notice:',
  systemRequirementsHeading: 'System requirements',
  minimumSystemRequirements: 'Minimum',
  recommendedSystemRequirements: 'Recommended',
  similarToThis: 'Similar to this',
  galleryHeading: 'Trailer & screenshots',
  ratingReviewsHeading: 'Ratings & reviews',
  basedOnOneReview: 'Based on 1 review',
  basedOnReviews: 'Based on {count} reviews',
  writeAReview: 'Write a review',
  writeFirstReview: 'Write the first review',
  failedToLoadReviews: 'Failed to load reviews.',
  noReviewsYet: 'No reviews yet for this product.',
  loadMoreReviews: 'Load more reviews',
  loadingReviews: 'Loading...',
  verifiedPurchase: 'Verified purchase',
  storeReply: 'Reply from Increddy',
  sortBy: 'Sort by',
  sortMostRecent: 'Most recent',
  sortOldest: 'Oldest',
  sortHighestRated: 'Highest rated',
  sortLowestRated: 'Lowest rated',
}

export function getDefaultProductTranslations(): ProductPageTranslations {
  return { ...defaultLabels }
}

/**
 * Translated product data fields (description + descriptionHtml).
 */
export interface TranslatedProductData {
  description: string
  descriptionHtml: string
}

const getTranslatedProductPlainTexts = unstable_cache(
  async (locale: string, textsToTranslate: string[]) => {
    return translateTextsWithLangbly(textsToTranslate, locale)
  },
  ['product-page-plain-texts'],
  { revalidate: 3600 },
)

const getTranslatedProductHtmlTexts = unstable_cache(
  async (locale: string, textsToTranslate: string[]) => {
    return translateTextsWithLangbly(textsToTranslate, locale, {
      tagHandling: 'html',
    })
  },
  ['product-page-html-texts'],
  { revalidate: 3600 },
)

/**
 * Translates product page UI labels and product content in parallel.
 * Uses tagHandling: 'html' for descriptionHtml to preserve HTML structure.
 */
export async function translateProductPageData(
  product: Product,
  locale: string,
): Promise<{
  labels: ProductPageTranslations
  productData: TranslatedProductData
}> {
  // Batch 1: Plain text UI labels
  const labelKeys = Object.keys(defaultLabels) as (keyof ProductPageTranslations)[]
  const labelTexts = labelKeys.map((key) => defaultLabels[key])

  // Also add product.description to plain text batch
  labelTexts.push(product.description || '')

  // Batch 2: HTML content (product.descriptionHtml)
  const htmlTexts = [product.descriptionHtml || '']

  const [translatedPlain, translatedHtml] = await Promise.all([
    getTranslatedProductPlainTexts(locale, labelTexts),
    getTranslatedProductHtmlTexts(locale, htmlTexts),
  ])

  // Map label translations back
  const labels = { ...defaultLabels }
  labelKeys.forEach((key, i) => {
    labels[key] = translatedPlain[i]
  })

  // Product description is the last item in plain batch
  const description = translatedPlain[labelKeys.length]
  const descriptionHtml = translatedHtml[0]

  return {
    labels,
    productData: { description, descriptionHtml },
  }
}
