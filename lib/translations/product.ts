import { unstable_cache } from 'next/cache'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import type { Product } from '@/types/product'

/**
 * All translatable UI labels for the product page.
 */
export interface ProductPageTranslations {
  // ProductDescription component
  productDescriptionHeading: string
  readMore: string
  readLess: string
  // ProductDetails component
  instantDeliveryBadge: string
  onSaleBadge: string
  digitalKeyBadge: string
  activationGuide: string
  inStock: string
  outOfStock: string
  digitalDownload: string
  buyNow: string
  // FeatureRow
  instant: string
  delivery: string
  secure: string
  // WarningBox
  importantNotice: string
  warningText: string
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
  outOf5: string
  basedOnReviews: string
  writeAReview: string
  failedToLoadReviews: string
  noReviewsYet: string
  loadMoreReviews: string
  loadingReviews: string
}

const defaultLabels: ProductPageTranslations = {
  productDescriptionHeading: 'Product Description',
  readMore: 'Read more',
  readLess: 'Read less',
  instantDeliveryBadge: 'INSTANT DELIVERY',
  onSaleBadge: 'ON SALE',
  digitalKeyBadge: 'DIGITAL KEY',
  activationGuide: 'Activation Guide',
  inStock: 'In Stock',
  outOfStock: 'Out of Stock',
  digitalDownload: 'Digital Download',
  buyNow: 'Buy Now',
  instant: 'Instant',
  delivery: 'Delivery',
  secure: 'Secure',
  importantNotice: 'Important Notice:',
  warningText:
    'Works with both the OLD and NEW Xbox accounts as long as there is no active subscription. The product is only available in countries where XBOX LIVE service is available. You cannot extend your current subscription with this product. To redeem your key, your current subscription must first expire.',
  systemRequirementsHeading: 'System Requirements',
  minimumSystemRequirements: 'Minimum System Requirements',
  recommendedSystemRequirements: 'Recommended System Requirements',
  similarToThis: 'Similar to This',
  galleryHeading: 'Gallery',
  ratingReviewsHeading: 'Rating & Reviews',
  outOf5: 'Out of 5',
  basedOnReviews: 'based on {count} reviews',
  writeAReview: 'Write a Review',
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
