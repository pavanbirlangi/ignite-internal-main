'use client'

import { useCallback, useState, type KeyboardEvent } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useProducts } from '@/hooks/useProducts'
import type { ProductListItem } from '@/types/product'

// Live product suggestions for a search box: debounced query, the suggestion list, and arrow-key
// selection (wrapping, with "See all results" as the last row). Shared by the header search and
// the hero search so both behave the same.
export function useSearchSuggestions({
  open,
  onSelectProduct,
  onSearchAll,
}: {
  // Whether the box is open/focused; suggestions only show while it is.
  open: boolean
  onSelectProduct: (product: ProductListItem) => void
  onSearchAll: (query: string) => void
}) {
  const [inputValue, setInput] = useState('')
  // Row picked with the arrow keys (suggestions.length = "See all results"), -1 for none.
  const [activeIndex, setActiveIndex] = useState(-1)

  const debouncedQuery = useDebounce(inputValue.trim(), 300)
  const shouldFetch = debouncedQuery.length >= 2
  const { data, isLoading } = useProducts(
    { query: debouncedQuery, first: 5 },
    shouldFetch,
  )

  const suggestions = data?.products ?? []
  const suggestionsOpen = open && shouldFetch
  const optionCount =
    suggestionsOpen && !isLoading && suggestions.length > 0
      ? suggestions.length + 1
      : 0

  // Stable, so callers can use it in effects.
  const setInputValue = useCallback((value: string) => {
    setInput(value)
    setActiveIndex(-1)
  }, [])
  const resetActive = useCallback(() => setActiveIndex(-1), [])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && optionCount > 0) {
      e.preventDefault()
      // Wraps around at both ends.
      setActiveIndex((index) =>
        e.key === 'ArrowDown'
          ? index >= optionCount - 1
            ? 0
            : index + 1
          : index <= 0
            ? optionCount - 1
            : index - 1,
      )
    }
    if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        onSelectProduct(suggestions[activeIndex])
      } else {
        onSearchAll(inputValue)
      }
    }
  }

  return {
    inputValue,
    setInputValue,
    activeIndex,
    resetActive,
    debouncedQuery,
    suggestions,
    suggestionsOpen,
    isLoading: isLoading && shouldFetch,
    handleKeyDown,
  }
}
