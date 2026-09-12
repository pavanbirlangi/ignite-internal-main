import { unstable_cache } from 'next/cache'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import { type StoreData } from '@/lib/services/store.service'

/**
 * All translatable UI strings for the store page.
 */
export interface StoreTranslations {
  // StoreHero
  heroTitle: string
  heroDescription: string
  // StoreHeader breadcrumbs
  breadcrumbHome: string
  breadcrumbStore: string
  // StoreListing
  allProductsTitle: string
  searchResultsPrefix: string
  noProductsTitle: string
  noProductsDescription: string
  clearAllFilters: string
  failedToLoad: string
  showingText: string
  productsText: string
  ofText: string
}

/** Default English strings */
const defaultStrings: StoreTranslations = {
  heroTitle: 'Discover. Compare. Play.',
  heroDescription:
    'Browse games that match your play-style. Filter, compare, and checkout in seconds.',
  breadcrumbHome: 'Home',
  breadcrumbStore: 'Store',
  allProductsTitle: 'All Products',
  searchResultsPrefix: 'Search results for',
  noProductsTitle: 'No products found',
  noProductsDescription: 'Try adjusting your filters or search criteria.',
  clearAllFilters: 'Clear all filters',
  failedToLoad: 'Failed to load products',
  showingText: 'Showing',
  productsText: 'products',
  ofText: 'of',
}

export function getDefaultStoreTranslations(): StoreTranslations {
  return { ...defaultStrings }
}

const getTranslatedStoreTexts = unstable_cache(
  async (locale: string, textsToTranslate: string[]) => {
    return translateTextsWithLangbly(textsToTranslate, locale)
  },
  ['store-page-texts'],
  { revalidate: 3600 },
)

/**
 * Translates all store page UI strings in a single Langbly batch call.
 */
export async function translateStoreData(
  locale: string,
): Promise<StoreTranslations> {
  const keys = Object.keys(defaultStrings) as (keyof StoreTranslations)[]
  const textsToTranslate = keys.map((key) => defaultStrings[key])

  const translated = await getTranslatedStoreTexts(locale, textsToTranslate)

  const result = { ...defaultStrings }
  keys.forEach((key, i) => {
    result[key] = translated[i]
  })

  return result
}

/**
 * Translates dynamic store CMS data (hero title, description).
 */
export async function translateStoreCMSData(
  data: StoreData,
  locale: string,
): Promise<StoreData> {
  const textsToTranslate = [data.title || '', data.description || '']
  const translated = await getTranslatedStoreTexts(locale, textsToTranslate)

  return {
    ...data,
    title: translated[0],
    description: translated[1],
  }
}
