import Image from 'next/image'
import Link from 'next/link'
import {
  HomepageService,
  type ExploreGenreItem,
  type ExplorePlatformItem,
} from '@/lib/services/homepage.service'
import { translateHomepageData } from '@/lib/translations/homepage'
import { getWebPageJsonLd } from '@/lib/seo'

type PlatformCard = {
  name: string
  icon: string
  href: string
}

type GenreCard = {
  id: number
  name: string
  href: string
  iconHtml?: string
}

type CategoriesPageParams = Promise<{ locale: string }>

function toStoreQueryHref(key: 'platform' | 'genre', value: string) {
  return `/store?${key}=${encodeURIComponent(value)}`
}

export default async function CategoriesPage({
  params,
}: {
  params: CategoriesPageParams
}) {
  const { locale } = await params
  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: 'categories',
    name: 'Categories | Increddy',
    description: 'Browse game categories and platforms on Increddy.',
  })

  let platformsTitle = ''
  let genreTitle = ''
  let platforms: PlatformCard[] = []
  let genres: GenreCard[] = []

  try {
    let data = await HomepageService.getHomepage()

    if (locale.toUpperCase() !== 'EN') {
      data = await translateHomepageData(data, locale)
    }

    const explorePlatformsSection = data.sections.find(
      (section) => section.collection === 'explore_platforms' && section.item,
    )
    const exploreGenreSection = data.sections.find(
      (section) => section.collection === 'explore_genre' && section.item,
    )

    if (explorePlatformsSection?.item) {
      const item = explorePlatformsSection.item as ExplorePlatformItem
      platformsTitle = item.title || platformsTitle
      platforms = item.platforms.map((platform) => {
        const platformData = platform.Platforms_id as {
          id: number
          name: string
          image: string
          to?: string
        }

        return {
          name: platformData.name,
          icon: `${process.env.NEXT_PUBLIC_CMS_API_URL}/assets/${platformData.image}`,
          href:
            platformData.to || toStoreQueryHref('platform', platformData.name),
        }
      })
    }

    if (exploreGenreSection?.item) {
      const item = exploreGenreSection.item as ExploreGenreItem
      genreTitle = item.title || genreTitle
      genres = item.genres.map((genre) => {
        const genreData = genre.Genres_id as {
          id: number
          label: string
          icon: string
          to?: string
        }

        return {
          id: genreData.id,
          name: genreData.label,
          iconHtml: genreData.icon,
          href: genreData.to || toStoreQueryHref('genre', genreData.label),
        }
      })
    }
  } catch (error) {
    console.error('[CategoriesPage] Failed to fetch category data:', error)
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd),
        }}
      />
      <div className="bg-background text-foreground min-h-screen pb-24">
        <main className="flex flex-col gap-10 px-5 pt-8">
          {/* Platforms Section */}
          <section className="flex flex-col gap-5">
            <h2 className="text-lg font-semibold tracking-wide text-white md:text-[20px]">
              {platformsTitle}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {platforms.map((platform) => (
                <Link
                  key={platform.name}
                  href={platform.href}
                  className="bg-secondary flex h-31.75 flex-col items-center justify-center gap-5 rounded-lg transition-colors hover:bg-white/10"
                >
                  <div className="relative h-10 w-10 overflow-hidden rounded-full">
                    <Image
                      src={platform.icon}
                      alt={platform.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium text-white">
                    {platform.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Genres Section */}
          <section className="flex flex-col gap-5">
            <h2 className="text-lg font-semibold tracking-wide text-white md:text-[20px]">
              {genreTitle}
            </h2>
            <div className="flex flex-col gap-3">
              {genres.map((genre) => {
                return (
                  <Link
                    key={genre.name}
                    href={genre.href}
                    className="bg-secondary flex h-13 items-center gap-3 rounded-lg px-6 transition-colors hover:bg-white/10"
                  >
                    {genre.iconHtml ? (
                      <div
                        className="size-5 text-white [&>svg]:h-full [&>svg]:w-full"
                        dangerouslySetInnerHTML={{ __html: genre.iconHtml }}
                      />
                    ) : null}
                    <span className="text-sm font-medium text-white">
                      {genre.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        </main>
      </div>
    </>
  )
}
