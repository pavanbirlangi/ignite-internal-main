import { create } from 'zustand'

interface StoreFiltersState {
  priceMin: string
  priceMax: string
  searchQuery: string
  selectedPlatforms: string[]
  selectedGenres: string[]
  selectedWorksOn: string[]
  selectedRegions: string[]
  selectedProductTypes: string[]
  sortBy: string
  currentPage: number
  cursors: Record<number, string>

  setPriceMin: (val: string) => void
  setPriceMax: (val: string) => void
  setSearchQuery: (val: string) => void
  setSelectedPlatforms: (val: string[]) => void
  setSelectedGenres: (val: string[]) => void
  setSelectedProductTypes: (val: string[]) => void
  togglePlatform: (id: string) => void
  toggleGenre: (id: string) => void
  toggleWorksOn: (id: string) => void
  toggleRegion: (id: string) => void
  toggleProductType: (id: string) => void
  removeFilter: (id: string) => void
  setSortBy: (val: string) => void
  setCurrentPage: (page: number) => void
  setCursors: (page: number, cursor: string) => void
  setFiltersFromParams: (params: Partial<StoreFiltersState>) => void
  clearAllFilters: () => void
}

const toggleArrayItem = (arr: string[], item: string) => {
  const itemLower = item.toLowerCase()
  const isIncluded = arr.some(i => i.toLowerCase() === itemLower)
  return isIncluded 
    ? arr.filter(i => i.toLowerCase() !== itemLower)
    : [...arr, item]
}

export const useStoreFilters = create<StoreFiltersState>((set) => ({
  priceMin: '',
  priceMax: '',
  searchQuery: '',
  selectedPlatforms: [],
  selectedGenres: [],
  selectedWorksOn: [],
  selectedRegions: [],
  selectedProductTypes: [],
  sortBy: 'popularity',
  currentPage: 1,
  cursors: {},

  setPriceMin: (val) => set({ priceMin: val, currentPage: 1, cursors: {} }),
  setPriceMax: (val) => set({ priceMax: val, currentPage: 1, cursors: {} }),
  setSearchQuery: (val) =>
    set({ searchQuery: val, currentPage: 1, cursors: {} }),
  setSelectedPlatforms: (val) =>
    set({ selectedPlatforms: val, currentPage: 1, cursors: {} }),
  setSelectedGenres: (val) =>
    set({ selectedGenres: val, currentPage: 1, cursors: {} }),
  setSelectedProductTypes: (val) =>
    set({ selectedProductTypes: val, currentPage: 1, cursors: {} }),
  togglePlatform: (id) =>
    set((state) => ({
      selectedPlatforms: toggleArrayItem(state.selectedPlatforms, id),
      currentPage: 1,
      cursors: {},
    })),
  toggleGenre: (id) =>
    set((state) => ({
      selectedGenres: toggleArrayItem(state.selectedGenres, id),
      currentPage: 1,
      cursors: {},
    })),
  toggleWorksOn: (id) =>
    set((state) => ({
      selectedWorksOn: toggleArrayItem(state.selectedWorksOn, id),
      currentPage: 1,
      cursors: {},
    })),
  toggleRegion: (id) =>
    set((state) => ({
      selectedRegions: toggleArrayItem(state.selectedRegions, id),
      currentPage: 1,
      cursors: {},
    })),
  toggleProductType: (id) =>
    set((state) => ({
      selectedProductTypes: toggleArrayItem(state.selectedProductTypes, id),
      currentPage: 1,
      cursors: {},
    })),
  removeFilter: (id) =>
    set((state) => {
      const idLower = id.toLowerCase()
      return {
        selectedPlatforms: state.selectedPlatforms.filter((i) => i.toLowerCase() !== idLower),
        selectedGenres: state.selectedGenres.filter((i) => i.toLowerCase() !== idLower),
        selectedWorksOn: state.selectedWorksOn.filter((i) => i.toLowerCase() !== idLower),
        selectedRegions: state.selectedRegions.filter((i) => i.toLowerCase() !== idLower),
        selectedProductTypes: state.selectedProductTypes.filter((i) => i.toLowerCase() !== idLower),
        currentPage: 1,
        cursors: {},
      }
    }),
  setSortBy: (val) => set({ sortBy: val, currentPage: 1, cursors: {} }),
  setCurrentPage: (val) => set({ currentPage: val }),
  setCursors: (page, cursor) =>
    set((state) => ({ cursors: { ...state.cursors, [page]: cursor } })),
  setFiltersFromParams: (params) => set((state) => ({ ...state, ...params })),
  clearAllFilters: () =>
    set({
      priceMin: '',
      priceMax: '',
      searchQuery: '',
      selectedPlatforms: [],
      selectedGenres: [],
      selectedWorksOn: [],
      selectedRegions: [],
      selectedProductTypes: [],
      currentPage: 1,
      cursors: {},
    }),
}))
