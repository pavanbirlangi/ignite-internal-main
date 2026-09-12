'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import FilterBar from './FilterBar'
import FilterSidebar from './FilterSidebar'
import MobileFilter from './MobileFilter'
import StoreHeader from './StoreHeader'
import ProductSkeleton from './ProductSkeleton'
import Pagination from './Pagination'
import { SortOption } from '../../types/store/types'
import { useStoreFilters } from '@/store/useStoreFilters'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { usePlatforms } from '@/hooks/usePlatforms'
import { useGenres } from '@/hooks/useGenres'
import { useRegions } from '@/hooks/useRegions'
import { useWorksOn } from '@/hooks/useWorksOn'
import { GENRES, REGIONS } from '@/data/filterData'
import type { StoreTranslations } from '@/lib/translations/store'
import StoreCard from './StoreCard'

const staticFilters = [...GENRES, ...REGIONS]

interface StoreListingProps {
  translations?: Partial<StoreTranslations>
}

const StoreListing = ({ translations }: StoreListingProps) => {
  const filters = useStoreFilters()
  const ITEMS_PER_PAGE = 15
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString()

  useEffect(() => {
    const urlParams = new URLSearchParams(searchParamsString)
    const params: any = {}

    // Synchronize multi-select filters from URL params
    const syncMultiSelect = (
      storeKey: keyof typeof filters,
      paramKey: string,
    ) => {
      const val = urlParams.get(paramKey)
      const array = val ? val.split(',') : []

      const currentArray = filters[storeKey] as string[]
      const arrayLower = array.map((i) => i.toLowerCase()).sort()
      const currentLower = currentArray.map((i) => i.toLowerCase()).sort()

      // Only update if different to avoid unnecessary store updates
      if (JSON.stringify(arrayLower) !== JSON.stringify(currentLower)) {
        params[storeKey] = array
      }
    }

    // Search Query
    const q = urlParams.get('q') || ''
    if (q !== filters.searchQuery) params.searchQuery = q

    syncMultiSelect('selectedPlatforms', 'platform')
    syncMultiSelect('selectedProductTypes', 'category')
    syncMultiSelect('selectedGenres', 'genre')
    syncMultiSelect('selectedWorksOn', 'worksOn')
    syncMultiSelect('selectedRegions', 'region')

    // Sort
    const sort = urlParams.get('sort')
    if (sort && sort !== filters.sortBy) {
      params.sortBy = sort
    } else if (
      !sort &&
      filters.sortBy !== 'popularity' &&
      !urlParams.has('q')
    ) {
      params.sortBy = 'popularity'
    }

    // Price Range
    const minPrice = urlParams.get('minPrice')
    if (minPrice !== null && minPrice !== filters.priceMin) {
      params.priceMin = minPrice
    } else if (minPrice === null && filters.priceMin !== '') {
      params.priceMin = ''
    }

    const maxPrice = urlParams.get('maxPrice')
    if (maxPrice !== null && maxPrice !== filters.priceMax) {
      params.priceMax = maxPrice
    } else if (maxPrice === null && filters.priceMax !== '') {
      params.priceMax = ''
    }

    // Pagination
    const page = urlParams.get('page')
    if (page) {
      const pageNum = parseInt(page)
      if (pageNum !== filters.currentPage) params.currentPage = pageNum
    } else if (filters.currentPage !== 1) {
      params.currentPage = 1
    }

    if (Object.keys(params).length > 0) {
      filters.setFiltersFromParams(params)
    }
  }, [searchParamsString])

  let sortKey = 'BEST_SELLING'
  let reverse = false
  if (filters.sortBy === 'price-low-high') {
    sortKey = 'PRICE'
    reverse = false
  }
  if (filters.sortBy === 'price-high-low') {
    sortKey = 'PRICE'
    reverse = true
  }
  if (filters.sortBy === 'newest') {
    sortKey = 'CREATED_AT'
    reverse = true
  }
  if (filters.sortBy === 'popularity') {
    sortKey = 'BEST_SELLING'
    reverse = false
  }

  const { data, isLoading, isError } = useProducts({
    first: ITEMS_PER_PAGE,
    // Medusa's pagination is page-based, not cursor-based -- `after` is
    // repurposed by product.service.ts as a page-number string, so any page
    // can be requested directly without needing a cached cursor chain.
    after: filters.currentPage === 1 ? undefined : String(filters.currentPage),
    query: filters.searchQuery || undefined,
    sortKey: sortKey as 'TITLE' | 'PRICE' | 'BEST_SELLING' | 'CREATED_AT',
    reverse,
    category: filters.selectedProductTypes.length
      ? filters.selectedProductTypes.join(',')
      : undefined,
    genre: filters.selectedGenres.length
      ? filters.selectedGenres.join(',')
      : undefined,
    platform: filters.selectedPlatforms.length
      ? filters.selectedPlatforms.join(',')
      : undefined,
    worksOn: filters.selectedWorksOn.length
      ? filters.selectedWorksOn.join(',')
      : undefined,
    region: filters.selectedRegions.length
      ? filters.selectedRegions.join(',')
      : undefined,
    minPrice: filters.priceMin ? Number(filters.priceMin) : undefined,
    maxPrice: filters.priceMax ? Number(filters.priceMax) : undefined,
  })

  // Determine standard structure based on new API response format
  const products = data?.products || []

  const totalCount = data?.totalCount || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))

  const { data: categoriesData } = useCategories()
  const dynamicCategories = categoriesData?.categories || []

  const { data: platformsData } = usePlatforms()
  const dynamicPlatforms = platformsData?.platforms || []

  const { data: genresData } = useGenres()
  const dynamicGenres = genresData?.genres || []

  const { data: regionsData } = useRegions()
  const dynamicRegions = regionsData?.regions || []

  const { data: worksOnData } = useWorksOn()
  const dynamicWorksOn = worksOnData?.worksOn || []

  const activeFilters = [
    ...filters.selectedPlatforms,
    ...filters.selectedGenres,
    ...filters.selectedWorksOn,
    ...filters.selectedRegions,
    ...filters.selectedProductTypes,
  ].map((id) => {
    const staticFilter = staticFilters.find((f) => {
      const fId = typeof f.id === 'string' ? f.id : f.id.name
      return fId.toLowerCase() === id.toLowerCase()
    })

    if (staticFilter) {
      const label =
        typeof staticFilter.label === 'string'
          ? staticFilter.label
          : staticFilter.label.name
      return { id, label }
    }

    const idLower = id.toLowerCase()

    const dynamicCat = dynamicCategories.find(
      (c: any) => c.handle.toLowerCase() === idLower,
    )
    if (dynamicCat) return { id, label: dynamicCat.title }

    const dynamicPlatform = dynamicPlatforms.find(
      (p: any) => p.name.toLowerCase() === idLower,
    )
    if (dynamicPlatform) return { id, label: dynamicPlatform.name }

    const dynamicGenre = dynamicGenres.find(
      (g: any) => g.name.toLowerCase() === idLower,
    )
    if (dynamicGenre) return { id, label: dynamicGenre.name }

    const dynamicWorkOn = dynamicWorksOn.find(
      (w: any) => w.name.toLowerCase() === idLower,
    )
    if (dynamicWorkOn) return { id, label: dynamicWorkOn.name }

    const dynamicRegion = dynamicRegions.find(
      (r: any) => r.name.toLowerCase() === idLower,
    )
    if (dynamicRegion) return { id, label: dynamicRegion.name }

    return { id, label: id }
  })

  const handleSortChange = (option: SortOption) => {
    filters.setSortBy(option)
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', option)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleRemoveFilter = (id: string) => {
    filters.removeFilter(id)
    const params = new URLSearchParams(searchParams.toString())
    const filterKeys = ['platform', 'category', 'genre', 'worksOn', 'region']
    const idLower = id.toLowerCase()
    filterKeys.forEach((key) => {
      const val = params.get(key)
      if (val) {
        const parts = val.split(',')
        if (parts.some((p) => p.toLowerCase() === idLower)) {
          const newParts = parts.filter((p) => p.toLowerCase() !== idLower)
          if (newParts.length > 0) {
            params.set(key, newParts.join(','))
          } else {
            params.delete(key)
          }
        }
      }
    })
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleClearAll = () => {
    filters.clearAllFilters()
    router.push(pathname, { scroll: false })
  }

  const handlePageChange = (page: number) => {
    filters.setCurrentPage(page)
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', page.toString())
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const allProductsLabel = translations?.allProductsTitle ?? 'All Products'
  const searchPrefix = translations?.searchResultsPrefix ?? 'Search results for'
  const noProductsLabel = translations?.noProductsTitle ?? 'No products found'
  const noProductsDesc =
    translations?.noProductsDescription ??
    'Try adjusting your filters or search criteria.'
  const clearAllLabel = translations?.clearAllFilters ?? 'Clear all filters'
  const failedLabel = translations?.failedToLoad ?? 'Failed to load products'

  return (
    <div className="mx-auto flex w-full max-w-360 flex-col gap-8 px-4 pb-32">
      <StoreHeader
        title={
          filters.searchQuery
            ? `${searchPrefix} "${filters.searchQuery}"`
            : allProductsLabel
        }
        totalProducts={totalCount}
        startIndex={(filters.currentPage - 1) * ITEMS_PER_PAGE + 1}
        endIndex={Math.min(filters.currentPage * ITEMS_PER_PAGE, totalCount)}
        labels={{
          home: translations?.breadcrumbHome,
          store: translations?.breadcrumbStore,
          showing: translations?.showingText,
          products: translations?.productsText,
          of: translations?.ofText,
        }}
      />

      <div className="md:w-48 lg:hidden">
        <MobileFilter />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="hidden shrink-0 lg:block">
          <FilterSidebar />
        </div>

        <div className="flex flex-1 flex-col gap-8">
          <FilterBar
            sortBy={filters.sortBy as SortOption}
            onSortChange={handleSortChange}
            activeFilters={activeFilters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAll}
          />

          {isLoading ? (
            <div className="grid grid-cols-2 justify-items-center gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <h3 className="text-red font-['Cooper_Hewitt'] text-[24px] font-bold">
                {failedLabel}
              </h3>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 justify-items-center gap-x-[14px] gap-y-6 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product: any) => (
                <StoreCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <h3 className="font-['Cooper_Hewitt'] text-[24px] font-bold text-white">
                {noProductsLabel}
              </h3>
              <p className="text-muted-foreground font-['Cooper_Hewitt'] text-[16px] font-medium">
                {noProductsDesc}
              </p>
              <button
                onClick={handleClearAll}
                className="bg-primary hover:bg-primary cursor-pointer rounded-lg px-6 py-2 font-['Cooper_Hewitt'] font-bold text-white transition-colors"
              >
                {clearAllLabel}
              </button>
            </div>
          )}

          {products.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex justify-center md:mt-14">
              <Pagination
                currentPage={filters.currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StoreListing
