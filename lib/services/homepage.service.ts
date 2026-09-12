import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import cmsClient from '../cms-axios'

export interface HomeSection {
  id: number
  homepage_id: number
  collection: 'product_recommendations' | 'explore_genre' | 'explore_platforms'
  item:
    | ProductRecommendationItem
    | ExploreGenreItem
    | ExplorePlatformItem
    | null
}

export interface ProductRecommendationItem {
  id: string
  status: string
  heading: string
  handle?: string | null
  products: Array<{
    products_id: {
      id: string
      title: string
      banner: string
      thumbnail: string
      price?: string
      originalPrice?: string
      discount?: string
    }
  }>
}

export interface ExploreGenreItem {
  id: string
  title: string
  genres: Array<{
    Genres_id: {
      id: number
      label: string
      icon: string
    }
  }>
}

export interface ExplorePlatformItem {
  id: string
  title: string
  platforms: Array<{
    Platforms_id: {
      id: number
      name: string
      image: string
    }
  }>
}

import type { SeoData } from '../seo'

export interface HomepageData {
  id: number
  seo?: SeoData
  hero_banner: string
  small_text: string
  heading: string
  key_points: Array<{
    icon: string
    text: string
  }>
  btn_text: string
  btn_url: string
  sections: HomeSection[]
  newsletter_title?: string
  newsletter_description?: string
  newsletter_placeholder_text?: string
}

export interface HomepageResponse {
  data: HomepageData
}

const _fetchHomepage = async (): Promise<HomepageData> => {
  const response = await cmsClient.get<HomepageResponse>(
    '/items/homepage?fields=*,sections.*,sections.item.*,sections.item.products.products_id.*,sections.item.genres.Genres_id.*,sections.item.platforms.Platforms_id.*,seo.*',
  )
  return response.data.data
}

const _cachedGetHomepage = unstable_cache(_fetchHomepage, ['homepage'], {
  revalidate: 60,
  tags: ['homepage'],
})

export const HomepageService = {
  /** Fetches homepage data. Deduplicated per-request + cached 60s across requests. */
  getHomepage: cache(_cachedGetHomepage),
}
