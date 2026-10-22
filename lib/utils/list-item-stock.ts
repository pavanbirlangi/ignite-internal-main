import type { ProductListItem } from '@/types/product'

// Same rule as the store cards: a list item can be bought when its first variant can.
export function isListItemBuyable(item: ProductListItem): boolean {
  const first = Array.isArray(item.variants) ? item.variants[0] : item.variants?.edges?.[0]?.node
  return first?.availableForSale ?? true
}
