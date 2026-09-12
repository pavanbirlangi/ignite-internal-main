export interface FilterOption {
  id: string | { name: string; count: number }
  label: string | { name: string; count: number }
  count: number
}

export interface FilterCategory {
  id: string
  title: string
  options: FilterOption[]
}

export const PRODUCT_TYPES: FilterOption[] = [
  { id: 'games', label: 'Games', count: 1524 },
  { id: 'gift-cards', label: 'Gift Cards', count: 1524 },
  { id: 'dlc', label: 'DLC', count: 1524 },
  { id: 'software', label: 'Software', count: 1524 },
]

export const PLATFORMS: FilterOption[] = [
  { id: 'xbox', label: 'Xbox', count: 2488 },
  { id: 'steam', label: 'Steam', count: 2488 },
  { id: 'playstation', label: 'PlayStation', count: 2488 },
]

export const GENRES: FilterOption[] = [
  { id: 'indie', label: 'Indie', count: 2488 },
  { id: 'action', label: 'Action', count: 2488 },
  { id: 'adventure', label: 'Adventure', count: 2488 },
  { id: 'casual', label: 'Casual', count: 2488 },
  { id: 'rpg', label: 'RPG', count: 2488 },
  { id: 'massively-multiplayer', label: 'Massively Multiplayer', count: 2488 },
]

export const WORKS_ON: FilterOption[] = [
  { id: 'windows', label: 'Windows', count: 3142 },
  { id: 'mac', label: 'Mac', count: 3142 },
  { id: 'linux', label: 'Linux', count: 3142 },
]

export const REGIONS: FilterOption[] = [
  { id: 'global', label: 'Global', count: 1842 },
  { id: 'north-america', label: 'North America', count: 1842 },
  { id: 'europe', label: 'Europe', count: 1842 },
  { id: 'asia', label: 'Asia', count: 1842 },
  { id: 'south-america', label: 'South America', count: 1842 },
]
