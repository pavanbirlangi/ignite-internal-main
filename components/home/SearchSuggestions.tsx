'use client'

import SearchIcon from '../icons/SearchIcon'
import { SuggestionRow } from './search-suggestions/suggestion-row'
import type { SearchSuggestionsProps } from '@/types/SearchSuggestionTypes'

const SKELETON_COUNT = 3

export default function SearchSuggestions({
  suggestions,
  isLoading,
  query,
  onSelect,
  onSearchAll,
}: SearchSuggestionsProps) {
  const label = query.trim() ? 'Search Results' : 'Trending Searches'

  return (
    <div className="bg-secondary md:max-h-auto hidden-scrollbar absolute top-full right-0 left-0 z-50 mt-2 max-h-[85vh] w-full overflow-hidden overflow-y-auto rounded-xl border border-white/10 shadow-2xl shadow-black/80 md:mx-auto md:w-[672px]">
      <div className="flex flex-col gap-6 p-4 md:gap-8 md:px-5 md:pt-6 md:pb-5">
        {/* Heading */}
        <h2 className="text-lg leading-none font-semibold text-white capitalize md:text-[20px]">
          {label}
        </h2>

        {/* Body */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-4 rounded-lg border border-white/5 bg-white/5 p-3 md:gap-5"
              >
                <div className="h-[79px] w-[62px] shrink-0 rounded-[4px] bg-white/10" />
                <div className="flex flex-1 flex-col gap-3">
                  <div className="h-3 w-3/4 rounded bg-white/10" />
                  <div className="h-3 w-1/4 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="flex flex-col gap-3">
            {suggestions.map((product) => (
              <SuggestionRow
                key={product.id}
                product={product}
                query={query}
                onSelect={onSelect}
              />
            ))}

            {/* See-all footer */}
            <button
              type="button"
              onClick={onSearchAll}
              className="text-primary mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/5 px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/10 focus:outline-none md:justify-start"
            >
              <SearchIcon className="size-4 shrink-0" />
              <span>
                See all results for&nbsp;
                <span className="text-white">&ldquo;{query}&rdquo;</span>
              </span>
            </button>
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No results for &ldquo;{query}&rdquo;
          </p>
        )}
      </div>
    </div>
  )
}
