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
  priceNotFinal: string
  priceNotFinalTip: string
  buyNow: string
  addToCart: string
  outOfStock: string
  notAvailable: string
  // ProductDescription component
  productDescriptionHeading: string
  readMore: string
  readLess: string
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
  failedToLoadReviews: string
  noReviewsYet: string
  loadMoreReviews: string
  loadingReviews: string
}

const defaultLabels: ProductPageTranslations = {
  instantDeliveryBadge: 'Instant delivery',
  onSaleBadge: 'On sale',
  reviewCountOne: '(1 review)',
  reviewCount: '({count} reviews)',
  activationGuide: 'Activation guide',
  priceNotFinal: 'Price not final',
  priceNotFinalTip: 'A small service fee and any taxes are added at checkout.',
  buyNow: 'Buy now',
  addToCart: 'Add to cart',
  outOfStock: 'Out of stock',
  notAvailable: 'Not available',
  productDescriptionHeading: 'About this game',
  readMore: 'Read more',
  readLess: 'Read less',
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
  failedToLoadReviews: 'Failed to load reviews.',
  noReviewsYet: 'No reviews yet for this product.',
  loadMoreReviews: 'Load more reviews',
  loadingReviews: 'Loading...',
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
