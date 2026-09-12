import { Suspense } from 'react'
import StoreListing from '@/components/store/StoreListing'
import StoreHero from '@/components/store/StoreHero'
import ProductSkeleton from '@/components/store/ProductSkeleton'
import {
  translateStoreData,
  getDefaultStoreTranslations,
  translateStoreCMSData,
} from '@/lib/translations/store'

import { StoreService, type StoreData } from '@/lib/services/store.service'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import type { Metadata } from 'next'
import { generateSeoMetadata, getWebPageJsonLd } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  let storeData: StoreData | null = null

  try {
    storeData = await StoreService.getStoreData()
  } catch (error) {
    console.error('[StorePage] Failed to fetch store data for metadata:', error)
  }

  return generateSeoMetadata(
    storeData?.seo,
    locale,
    'store',
    storeData?.title || 'Store | Increddy',
    storeData?.description || 'Browse our collection of game keys.',
    translateTextsWithLangbly,
  )
}

export default async function Store({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: 'store',
    name: 'Store | Increddy',
    description: 'Browse our collection of game keys.',
  })

  let storeData: StoreData | null = null
  try {
    storeData = await StoreService.getStoreData()
  } catch (error) {
    console.error('[StorePage] Failed to fetch store data:', error)
  }

  let translations = getDefaultStoreTranslations()

  if (locale.toUpperCase() !== 'EN') {
    try {
      translations = await translateStoreData(locale)
      if (storeData) {
        storeData = await translateStoreCMSData(storeData, locale)
      }
    } catch (error) {
      console.error('[StorePage] Translation failed, using defaults:', error)
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd),
        }}
      />
      <div className="min-h-screen w-full">
        <StoreHero
          title={storeData?.title || translations.heroTitle}
          description={storeData?.description || translations.heroDescription}
          bannerImage={storeData?.banner_image}
        />
        <div className="relative z-20 mt-5">
          <Suspense
            fallback={
              <div className="mx-auto flex w-full max-w-360 flex-col gap-8 px-4 pb-32">
                <div className="grid grid-cols-2 justify-items-center gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              </div>
            }
          >
            <StoreListing translations={translations} />
          </Suspense>
        </div>
      </div>
    </>
  )
}
