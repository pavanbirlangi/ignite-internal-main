import type { ProductListItem } from '@/types/product'

export interface MobileSearchProps {
  isOpen: boolean
  onClose: () => void
}

export interface HighlightedTextProps {
  text: string
  query: string
}

export interface SuggestionRowProps {
  product: ProductListItem
  query: string
  onSelect: (product: ProductListItem) => void
}
