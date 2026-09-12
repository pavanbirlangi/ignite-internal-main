import HeroSection from '@/components/home/HeroSection'
import dynamic from 'next/dynamic'
import {
  HomepageService,
  type HomepageData,
  type ExploreGenreItem,
  type ExplorePlatformItem,
  type ProductRecommendationItem,
} from '@/lib/services/homepage.service'
import { ProductService } from '@/lib/services/product.service'
import type { ProductListItem } from '@/types/product'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import { translateHomepageData } from '@/lib/translations/homepage'
import type { Metadata } from 'next'
import { generateSeoMetadata, getWebPageJsonLd } from '@/lib/seo'

export const revalidate = 900 // Revalidate homepage cache every 15 minutes

const GameCarouselSection = dynamic(
  () => import('@/components/shared/GameCarouselSection'),
  {
    loading: () => (
      <div className="container h-72 animate-pulse rounded-2xl bg-white/5" />
    ),
  },
)

const DiscoverByGenre = dynamic(
  () => import('@/components/home/DiscoverByGenre'),
  {
    loading: () => (
      <div className="container h-32 animate-pulse rounded-2xl bg-white/5" />
    ),
  },
)

const ExplorePlatforms = dynamic(
  () => import('@/components/home/ExplorePlatforms'),
  {
    loading: () => (
      <div className="container h-32 animate-pulse rounded-2xl bg-white/5" />
    ),
  },
)

const NewsletterSection = dynamic(
  () => import('@/components/home/NewsletterSection'),
  { loading: () => <div className="h-64 animate-pulse bg-white/5" /> },
)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  let data: HomepageData | null = null

  try {
    data = await HomepageService.getHomepage()
  } catch (error) {
    console.error('[HomePage] Failed to fetch data for metadata:', error)
  }

  return generateSeoMetadata(
    data?.seo,
    locale,
    '',
    'Increddy | Premium Game Keys',
    'Get the best deals on premium digital game keys at Increddy.',
    translateTextsWithLangbly,
  )
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: '',
    name: 'Increddy | Premium Game Keys',
    description: 'Get the best deals on premium digital game keys at Increddy.',
  })
  let data: HomepageData

  try {
    data = await HomepageService.getHomepage()
  } catch (error) {
    console.error('[HomePage] Failed to fetch homepage data:', error)
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webPageJsonLd),
          }}
        />
        <div className="-mb-1 flex flex-col gap-20">
          <NewsletterSection />
        </div>
      </>
    )
  }

  // Translate and fetch all collection products in parallel
  const recommendationSections = data.sections.filter(
    (section) =>
      section.collection === 'product_recommendations' && section.item,
  )

  const [translatedData, ...collectionResults] = await Promise.all([
    // Translation (no-op for EN, async otherwise)
    locale.toUpperCase() !== 'EN'
      ? translateHomepageData(data, locale).catch((error) => {
          console.error(
            '[HomePage] Translation failed, using original data:',
            error,
          )
          return data
        })
      : Promise.resolve(data),

    // All collection product fetches — run in parallel with translation
    ...recommendationSections.map((section) => {
      const item = section.item as ProductRecommendationItem
      const handle = item.handle?.trim()
      if (!handle)
        return Promise.resolve({
          id: section.id,
          games: [] as ProductListItem[],
        })

      return ProductService.getCollectionProductsByHandle(handle)
        .then((games) => ({ id: section.id, games }))
        .catch(() => ({ id: section.id, games: [] as ProductListItem[] }))
    }),
  ] as const)

  data = translatedData as HomepageData

  const gamesBySectionId = new Map<number, ProductListItem[]>(
    (collectionResults as Array<{ id: number; games: ProductListItem[] }>).map(
      ({ id, games }) => [id, games],
    ),
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd),
        }}
      />
      <div className="-mb-1 flex flex-col gap-16 md:gap-20">
        <HeroSection
          smallText={data.small_text}
          heading={data.heading}
          keyPoints={data.key_points}
          btnText={data.btn_text}
          btnUrl={data.btn_url}
          heroBanner={data.hero_banner}
        />

        {data.sections.map((section) => {
          if (!section.item) return null

          switch (section.collection) {
            case 'product_recommendations': {
              const item = section.item as ProductRecommendationItem
              const games = gamesBySectionId.get(section.id) ?? []

              return (
                <GameCarouselSection
                  key={section.id}
                  id={section.id.toString()}
                  title={item.heading}
                  games={games}
                  seeAllHref="/store"
                />
              )
            }

            case 'explore_genre': {
              const item = section.item as ExploreGenreItem
              return (
                <DiscoverByGenre
                  key={section.id}
                  title={item.title}
                  genres={item.genres.map((g: any) => ({
                    id: g.Genres_id.id,
                    name: g.Genres_id.label,
                    icon: g.Genres_id.icon,
                    to: g.Genres_id.to,
                  }))}
                />
              )
            }

            case 'explore_platforms': {
              const item = section.item as ExplorePlatformItem
              return (
                <ExplorePlatforms
                  key={section.id}
                  title={item.title}
                  platforms={item.platforms.map((p: any) => {
                    const name = p.Platforms_id.name
                    return {
                      id: p.Platforms_id.id,
                      name: name,
                      href: `/store?platform=${name}`,
                      image: p.Platforms_id.image,
                      to: p.Platforms_id.to,
                    }
                  })}
                />
              )
            }

            default:
              return null
          }
        })}

        <NewsletterSection
          title={data.newsletter_title}
          description={data.newsletter_description}
          placeholder={data.newsletter_placeholder_text}
        />
      </div>
    </>
  )
}
