import type { ProductListItem } from '@/types/product'

export interface SearchSuggestionsProps {
  suggestions: ProductListItem[]
  isLoading: boolean
  query: string
  onSelect: (product: ProductListItem) => void
  onSearchAll: () => void
}

export interface HomeHighlightedTextProps {
  text: string
  query: string
}

export interface SearchSuggestionRowProps {
  product: ProductListItem
  query: string
  onSelect: (product: ProductListItem) => void
}
