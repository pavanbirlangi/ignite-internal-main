'use client'

import React, { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import Cookies from 'js-cookie'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import FilterHeader from './filters/FilterHeader'
import FilterSearch from './filters/FilterSearch'
import FilterPriceRange from './filters/FilterPriceRange'
import FilterAccordion from './filters/FilterAccordion'
import { WORKS_ON } from '@/data/filterData'
import { useStoreFilters } from '@/store/useStoreFilters'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import { useCategories } from '@/hooks/useCategories'
import { usePlatforms } from '@/hooks/usePlatforms'
import { useGenres } from '@/hooks/useGenres'
import { useRegions } from '@/hooks/useRegions'
import { useWorksOn } from '@/hooks/useWorksOn'
import { useDebounce } from '@/hooks/useDebounce'

interface FilterSidebarProps {
  className?: string
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ className = '' }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const {
    priceMin,
    priceMax,
    searchQuery,
    selectedPlatforms,
    selectedGenres,
    selectedWorksOn,
    selectedRegions,
    selectedProductTypes,
    clearAllFilters,
    setPriceMin,
    setPriceMax,
    setSearchQuery,
    togglePlatform,
    toggleGenre,
    toggleWorksOn,
    toggleRegion,
    toggleProductType,
  } = useStoreFilters()

  const updateQueryParam = (name: string, value: string | string[] | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (
      value === null ||
      (Array.isArray(value) && value.length === 0) ||
      value === ''
    ) {
      params.delete(name)
    } else {
      params.set(name, Array.isArray(value) ? value.join(',') : value)
    }
    // Always reset to first page when changing filters
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const toggleArrayFilter = (
    currentList: string[],
    id: string,
    paramName: string,
    storeToggleAction: (id: string) => void,
  ) => {
    storeToggleAction(id) // Optimistic update
    const idLower = id.toLowerCase()
    const isIncluded = currentList.some((i) => i.toLowerCase() === idLower)
    const newList = isIncluded
      ? currentList.filter((i) => i.toLowerCase() !== idLower)
      : [...currentList, id]
    updateQueryParam(paramName, newList)
  }

  // Use local state for the search input so keystrokes are instant.
  // The global Zustand store + URL only update after the debounce fires.
  const [localSearch, setLocalSearch] = useState(searchQuery)

  React.useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handleSearchChange = (val: string) => {
    setLocalSearch(val)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(val)
      updateQueryParam('q', val)
    }, 400)
  }

  const [localMin, setLocalMin] = useState(priceMin)
  const [localMax, setLocalMax] = useState(priceMax)

  React.useEffect(() => {
    setLocalMin(priceMin)
  }, [priceMin])

  React.useEffect(() => {
    setLocalMax(priceMax)
  }, [priceMax])

  const priceMinTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handleMinPriceChange = (val: string) => {
    setLocalMin(val)
    if (priceMinTimeoutRef.current) clearTimeout(priceMinTimeoutRef.current)
    priceMinTimeoutRef.current = setTimeout(() => {
      setPriceMin(val)
      updateQueryParam('minPrice', val)
    }, 500)
  }

  const priceMaxTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handleMaxPriceChange = (val: string) => {
    setLocalMax(val)
    if (priceMaxTimeoutRef.current) clearTimeout(priceMaxTimeoutRef.current)
    priceMaxTimeoutRef.current = setTimeout(() => {
      setPriceMax(val)
      updateQueryParam('maxPrice', val)
    }, 500)
  }

  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
      if (priceMinTimeoutRef.current) clearTimeout(priceMinTimeoutRef.current)
      if (priceMaxTimeoutRef.current) clearTimeout(priceMaxTimeoutRef.current)
    }
  }, [])

  // Accordion Visibility States
  const [isProductTypeOpen, setIsProductTypeOpen] = useState(true)
  const [isPlatformsOpen, setIsPlatformsOpen] = useState(true)
  const [isGenresOpen, setIsGenresOpen] = useState(true)
  const [isWorksOnOpen, setIsWorksOnOpen] = useState(false)
  const [isRegionOpen, setIsRegionOpen] = useState(false)
  const currencyCode = useCurrencyStore((state) => state.currency)

  // Fetch dynamic categories
  const { data: categoriesData } = useCategories()
  const dynamicCategories =
    categoriesData?.categories?.map((cat) => ({
      id: cat.handle,
      label: cat.title,
      count: cat.count,
    })) || []

  // Fetch dynamic platforms
  const { data: platformsData } = usePlatforms()
  const dynamicPlatforms =
    platformsData?.platforms?.map((platform) => ({
      id: platform.name,
      label: platform.name,
      count: platform.count,
    })) || []

  const [genreSearch, setGenreSearch] = useState('')
  const [regionSearch, setRegionSearch] = useState('')
  const debouncedGenreSearch = useDebounce(genreSearch, 300)
  const debouncedRegionSearch = useDebounce(regionSearch, 300)

  const { data: genresData } = useGenres(debouncedGenreSearch)
  const dynamicGenres =
    genresData?.genres?.map((g) => ({
      id: g.name,
      label: g.name,
      count: g.count,
    })) || []

  const { data: regionsData } = useRegions(debouncedRegionSearch)
  const dynamicRegions =
    regionsData?.regions?.map((r) => ({
      id: r.name,
      label: r.name,
      count: r.count,
    })) || []

  const { data: worksOnData } = useWorksOn()
  const dynamicWorksOn =
    worksOnData?.worksOn?.map((workOn) => ({
      id: workOn.name,
      label: workOn.name,
      count: workOn.count,
    })) || WORKS_ON

  const handleClearAll = () => {
    clearAllFilters()
    router.replace(pathname, { scroll: false })
  }

  return (
    <div
      className={cn(
        'glassmorphism flex min-h-157.75 w-full lg:w-[288px] flex-none grow-0 flex-col items-start overflow-hidden rounded-2xl bg-(--secondary-20) p-0',
        className
      )}
    >
      <FilterHeader onClearAll={handleClearAll} />

      <FilterSearch value={localSearch} onChange={handleSearchChange} />

      <FilterPriceRange
        min={localMin}
        max={localMax}
        currencyCode={currencyCode}
        onMinChange={handleMinPriceChange}
        onMaxChange={handleMaxPriceChange}
      />

      {/* Accordions Container */}
      <div className="flex w-full flex-none grow-0 flex-col items-start gap-0 self-stretch">
        <FilterAccordion
          title="Categories"
          options={dynamicCategories}
          selectedIds={selectedProductTypes}
          onToggle={(id) =>
            toggleArrayFilter(
              selectedProductTypes,
              id,
              'category',
              toggleProductType,
            )
          }
          isOpen={isProductTypeOpen}
          setIsOpen={setIsProductTypeOpen}
        />

        <FilterAccordion
          title="Platforms"
          options={dynamicPlatforms}
          selectedIds={selectedPlatforms}
          onToggle={(id) =>
            toggleArrayFilter(selectedPlatforms, id, 'platform', togglePlatform)
          }
          isOpen={isPlatformsOpen}
          setIsOpen={setIsPlatformsOpen}
        />

        <FilterAccordion
          title="Genres"
          options={dynamicGenres}
          selectedIds={selectedGenres}
          onToggle={(id) =>
            toggleArrayFilter(selectedGenres, id, 'genre', toggleGenre)
          }
          isOpen={isGenresOpen}
          setIsOpen={setIsGenresOpen}
          hasSearch={true}
          onSearchChange={setGenreSearch}
        />

        <FilterAccordion
          title="Works On"
          options={dynamicWorksOn}
          selectedIds={selectedWorksOn}
          onToggle={(id) =>
            toggleArrayFilter(selectedWorksOn, id, 'worksOn', toggleWorksOn)
          }
          isOpen={isWorksOnOpen}
          setIsOpen={setIsWorksOnOpen}
        />

        <FilterAccordion
          title="Region"
          options={dynamicRegions}
          selectedIds={selectedRegions}
          onToggle={(id) =>
            toggleArrayFilter(selectedRegions, id, 'region', toggleRegion)
          }
          isOpen={isRegionOpen}
          setIsOpen={setIsRegionOpen}
          hasSearch={true}
          onSearchChange={setRegionSearch}
        />
      </div>
    </div>
  )
}

export default FilterSidebar
