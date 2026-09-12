'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import GuideCard, { GuideCardProps } from './GuideCard'
import {
  useActivationGuides,
  useSearchActivationGuides,
} from '@/hooks/useActivationGuides'
import { useDebounce } from '@/hooks/useDebounce'
import cmsClient from '@/lib/cms-axios'
import Link from 'next/link'
import { ActivationGuidesResponse } from '@/lib/services/help.service'

// We get the base URL straight from the axios client
const CMS_BASE_URL = cmsClient.defaults.baseURL || ''

function formatDate(dateString: string | null | undefined): string {
  const date = dateString ? new Date(dateString) : new Date()
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const PAGE_SIZE = 9

interface ActivationGuidesPageProps {
  translatedContent?: ActivationGuidesResponse['data']
}

export default function ActivationGuidesPage({
  translatedContent,
}: ActivationGuidesPageProps) {
  const { data: response, isLoading: isLoadingGrid } = useActivationGuides()

  // Use pre-translated content from server if available, otherwise use client-fetched data
  const content = translatedContent || response?.data

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const debouncedQuery = useDebounce(searchQuery, 300)

  const { data: searchResponse, isLoading: isSearchLoading } =
    useSearchActivationGuides(debouncedQuery)
  const searchResults = searchResponse?.data || []

  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const pageTitle = content?.page_title || 'Activation Guides'

  const allGuides: GuideCardProps[] = useMemo(() => {
    if (!content?.guides) return []
    return content.guides.map((item, index) => {
      const g = item.guides_id
      return {
        id: String(index + 1),
        title: g.title,
        date: formatDate(g.published_date),
        image: `${CMS_BASE_URL}/assets/${g.image}`,
        href: `/activation-guides/${g.slug}`,
      }
    })
  }, [content])

  // Still perform local filtering for the grid layout
  const filteredGuides = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return allGuides
    return allGuides.filter((g) => g.title.toLowerCase().includes(query))
  }, [searchQuery, allGuides])

  const visibleGuides = filteredGuides.slice(0, visibleCount)
  const hasMore = visibleCount < filteredGuides.length

  // Reset pagination when search changes
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setVisibleCount(PAGE_SIZE)
    setIsSearchFocused(true)
  }

  const showSuggestions = isSearchFocused && debouncedQuery.trim().length > 0

  return (
    <div className="container py-12 [--max-width-container:1297px] md:py-16">
      {/* Header Section */}
      <div className="mb-10 flex flex-col items-start gap-6 md:mb-12 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold text-white capitalize md:text-[32px] lg:text-[40px]">
          {pageTitle}
        </h1>

        <div
          className="relative w-full sm:max-w-130.5"
          ref={searchContainerRef}
        >
          <Search className="text-muted-foreground absolute top-1/2 left-4 size-6 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search here"
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setIsSearchFocused(true)}
            className="border-muted-foreground/40 text-foreground placeholder:text-muted-foreground focus:border-primary bg-background h-12.5 w-full rounded-full border pr-12 pl-10 text-lg font-medium transition-colors outline-none"
          />
          {isSearchLoading && (
            <div className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2">
              <Loader2 className="size-4 animate-spin" />
            </div>
          )}

          {/* Autocomplete Dropdown */}
          {showSuggestions && (
            <div className="border-border bg-background absolute top-[calc(100%+8px)] left-0 z-50 w-full rounded-[12px] border p-2 shadow-xl">
              {isSearchLoading ? (
                <div className="text-muted-foreground px-4 py-3 text-sm">
                  Loading suggestions...
                </div>
              ) : searchResults.length > 0 ? (
                <ul className="flex max-h-[300px] flex-col overflow-y-auto">
                  {searchResults.map((result) => (
                    <li key={result.slug}>
                      <Link
                        href={`/activation-guides/${result.slug}`}
                        className="text-muted-foreground block rounded-[8px] px-4 py-3 text-sm transition-colors hover:bg-white/5 hover:text-white"
                      >
                        {result.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted-foreground px-4 py-3 text-sm">
                  No guides found for &quot;{debouncedQuery}&quot;.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid Section */}
      {!translatedContent && isLoadingGrid ? (
        <div className="mb-16 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="flex animate-pulse flex-col gap-4">
              <div className="bg-muted/30 aspect-video w-full rounded-[12px]" />
              <div className="flex flex-col gap-2 px-0.5">
                <div className="bg-muted/30 h-6 w-3/4 rounded" />
                <div className="bg-muted/20 h-4 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredGuides.length === 0 ? (
        <div className="text-muted-foreground mb-16 flex min-h-[200px] items-center justify-center text-base">
          No guides found{searchQuery ? ` for "${searchQuery}"` : ''}.
        </div>
      ) : (
        <div className="mb-16 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {visibleGuides.map((guide) => (
            <GuideCard key={guide.id} {...guide} />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (translatedContent || !isLoadingGrid) && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="border-muted-foreground bg-secondary hover:bg-secondary/80 h-[52px] min-w-[160px] rounded-[6px] border px-12 text-[16px] font-semibold text-white"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}
