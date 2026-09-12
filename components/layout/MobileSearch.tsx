'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { useProducts } from '@/hooks/useProducts'
import {
  buildProductRoute,
  buildStoreSearchRoute,
} from '@/lib/search/search-utils'
import type { MobileSearchProps } from '@/types/MobileSearchTypes'
import type { ProductListItem } from '@/types/product'
import { MobileSearchSkeleton } from './mobile-search/mobile-search-skeleton'
import { SuggestionRow } from './mobile-search/suggestion-row'
import LeftArrowIcon from '../icons/LeftArrowIcon'
import XIcon from '../icons/XIcon'
import SearchIcon from '../icons/SearchIcon'

export function MobileSearch({ isOpen, onClose }: MobileSearchProps) {
  const router = useRouter()
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(inputValue.trim(), 300)
  const shouldFetch = debouncedQuery.length >= 2

  const { data, isLoading } = useProducts(
    { query: debouncedQuery, first: 5 },
    shouldFetch,
  )

  const suggestions = data?.products ?? []

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      document.body.style.overflow = 'auto'
      setInputValue('')
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSelectProduct = (product: ProductListItem) => {
    onClose()
    router.push(buildProductRoute(product))
  }

  const navigateToStore = (q: string) => {
    onClose()
    router.push(buildStoreSearchRoute(q))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') navigateToStore(inputValue)
    if (e.key === 'Escape') onClose()
  }

  const label = debouncedQuery.trim() ? 'Search Results' : 'Trending Searches'

  return (
    <div className="bg-background animate-in fade-in fixed inset-0 z-100 flex flex-col duration-200 md:hidden">
      {/* Search Header */}
      <div className="bg-secondary/20 flex h-[64px] items-center justify-between px-5">
        <div className="flex flex-1 items-center gap-[20px]">
          <button
            onClick={onClose}
            aria-label="Go back"
            className="-ml-1 p-1 text-white focus:outline-none"
          >
            <LeftArrowIcon className="size-6" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search games and gift cards"
            className="placeholder:text-muted-foreground flex-1 bg-transparent text-[14px] leading-[17px] font-medium text-white focus:outline-none"
            placeholder="Search for games, gift cards and more"
          />
        </div>

        {inputValue && (
          <button
            onClick={() => setInputValue('')}
            aria-label="Clear search"
            className=" ml-4 flex h-6 w-6 shrink-0 items-center justify-center  text-muted-foreground focus:outline-none"
          >
            <XIcon className="size-6" />
          </button>
        )}
      </div>

      {/* Search Body */}
      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-20">
        {isLoading && shouldFetch ? (
          <MobileSearchSkeleton />
        ) : suggestions.length > 0 ? (
          <>
            <h2 className="leading-non font-cooper mb-6 text-[20px] font-bold text-white capitalize">
              {label}
            </h2>
            <div className="flex flex-col gap-3">
              {suggestions.map((product: ProductListItem) => (
                <SuggestionRow
                  key={product.id}
                  product={product}
                  query={debouncedQuery}
                  onSelect={handleSelectProduct}
                />
              ))}

              {shouldFetch && (
                <button
                  type="button"
                  onClick={() => navigateToStore(inputValue)}
                  className="text-primary mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/5 px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/10 focus:outline-none"
                >
                  <SearchIcon className="size-4 shrink-0" />
                  <span>
                    See all results for&nbsp;
                    <span className="text-white">
                      &ldquo;{inputValue}&rdquo;
                    </span>
                  </span>
                </button>
              )}
            </div>
          </>
        ) : debouncedQuery.length > 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            No results found for &ldquo;{debouncedQuery}&rdquo;
          </p>
        ) : (
          /* Empty State / Trending Default (can place static trending items here if needed) */
          <div className="flex flex-col gap-3">
            {/* We can leave this empty or render static trending items */}
          </div>
        )}
      </div>
    </div>
  )
}
