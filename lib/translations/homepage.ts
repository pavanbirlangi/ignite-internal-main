import { unstable_cache } from 'next/cache'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import {
  type HomepageData,
  type ExploreGenreItem,
  type ExplorePlatformItem,
  type ProductRecommendationItem,
} from '@/lib/services/homepage.service'

/**
 * Translates the CMS-driven homepage data using Langbly.
 * Leaves product titles, URLs, images, and IDs untouched.
 */
const getTranslatedHomepageTexts = unstable_cache(
  async (locale: string, textsToTranslate: string[]) => {
    return translateTextsWithLangbly(textsToTranslate, locale)
  },
  ['homepage-texts'],
  { revalidate: 3600 },
)

export async function translateHomepageData(
  data: HomepageData,
  locale: string,
): Promise<HomepageData> {
  const textsToTranslate: string[] = [
    data.small_text || '',
    data.heading || '',
    data.btn_text || '',
    data.newsletter_title || 'Stay In The Game',
    data.newsletter_description || 'Get exclusive deals, early discounts, and instant alerts - straight to your inbox.',
    data.newsletter_placeholder_text || 'yourname@mail.com',
  ]

  const keyPoints = data.key_points || []
  for (const kp of keyPoints) {
    textsToTranslate.push(kp.text || '')
  }

  const sections = data.sections || []
  for (const section of sections) {
    if (!section.item) {
      textsToTranslate.push('')
      continue
    }
    switch (section.collection) {
      case 'product_recommendations': {
        const item = section.item as ProductRecommendationItem
        textsToTranslate.push(item.heading || '')
        break
      }
      case 'explore_genre': {
        const item = section.item as ExploreGenreItem
        textsToTranslate.push(item.title || '')
        for (const g of item.genres) {
          textsToTranslate.push(g.Genres_id.label || '')
        }
        break
      }
      case 'explore_platforms': {
        const item = section.item as ExplorePlatformItem
        textsToTranslate.push(item.title || '')
        for (const p of item.platforms) {
          textsToTranslate.push(p.Platforms_id.name || '')
        }
        break
      }
    }
  }

  const translated = await getTranslatedHomepageTexts(locale, textsToTranslate)

  let idx = 0
  const small_text = translated[idx++]
  const heading = translated[idx++]
  const btn_text = translated[idx++]
  const newsletter_title = translated[idx++]
  const newsletter_description = translated[idx++]
  const newsletter_placeholder_text = translated[idx++]

  const translatedKeyPoints = keyPoints.map((kp) => ({
    ...kp,
    text: translated[idx++],
  }))

  const translatedSections = sections.map((section) => {
    if (!section.item) {
      idx++
      return section
    }
    switch (section.collection) {
      case 'product_recommendations': {
        const item = section.item as ProductRecommendationItem
        return {
          ...section,
          item: { ...item, heading: translated[idx++] },
        }
      }
      case 'explore_genre': {
        const item = section.item as ExploreGenreItem
        const title = translated[idx++]
        const translatedGenres = item.genres.map((g) => ({
          ...g,
          Genres_id: { ...g.Genres_id, label: translated[idx++] },
        }))
        return {
          ...section,
          item: { ...item, title, genres: translatedGenres },
        }
      }
      case 'explore_platforms': {
        const item = section.item as ExplorePlatformItem
        const title = translated[idx++]
        const translatedPlatforms = item.platforms.map((p) => ({
          ...p,
          Platforms_id: { ...p.Platforms_id, name: translated[idx++] },
        }))
        return {
          ...section,
          item: { ...item, title, platforms: translatedPlatforms },
        }
      }
      default:
        return section
    }
  })

  return {
    ...data,
    small_text,
    heading,
    btn_text,
    newsletter_title,
    newsletter_description,
    newsletter_placeholder_text,
    key_points: translatedKeyPoints,
    sections: translatedSections,
  }
}
