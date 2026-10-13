import type { CSSProperties } from 'react'
import type { ProductListItem } from '@/types/product'

export interface SearchSuggestionsProps {
  suggestions: ProductListItem[]
  isLoading: boolean
  query: string
  onSelect: (product: ProductListItem) => void
  onSearchAll: () => void
  // Row picked with the arrow keys: 0..suggestions.length-1, suggestions.length for "See all
  // results", -1 for none.
  activeIndex?: number
  // Prefix for the rows' element ids, so the input can point at the active one.
  idPrefix?: string
}

export interface HomeHighlightedTextProps {
  text: string
  query: string
}

export interface SearchSuggestionRowProps {
  product: ProductListItem
  query: string
  onSelect: (product: ProductListItem) => void
  active?: boolean
  id?: string
  className?: string
  style?: CSSProperties
}
