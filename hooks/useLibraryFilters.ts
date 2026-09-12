import { useState, useEffect, useCallback } from 'react'
import type { GetLibraryParams, LibraryResponse } from '@/types/library'
import { toast } from 'sonner'

interface UseLibraryFiltersOptions {
  initialSort?: string
  initialOrder?: 'asc' | 'desc'
  pageSize?: number
}

interface UseLibraryFiltersReturn {
  queryParams: GetLibraryParams
  updateParam: (key: keyof GetLibraryParams, value: any) => void
  resetFilters: () => void
  data: LibraryResponse | null
  loading: boolean
  error: string | null
}

export function useLibraryFilters(
  fetchFn: (params: GetLibraryParams) => Promise<LibraryResponse>,
  options: UseLibraryFiltersOptions = {},
): UseLibraryFiltersReturn {
  const {
    initialSort = 'purchased_at',
    initialOrder = 'desc',
    pageSize = 20,
  } = options

  // Initialize query params with sensible defaults
  const [queryParams, setQueryParams] = useState<GetLibraryParams>({
    page: 1,
    limit: pageSize,
    sort: initialSort,
    order: initialOrder,
    search: '',
    category: '',
    platform: '',
    productType: '',
  })

  const [data, setData] = useState<LibraryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Update a single query parameter
   * Automatically resets pagination when any filter changes (except page param itself)
   */
  const updateParam = useCallback((key: keyof GetLibraryParams, value: any) => {
    setQueryParams((prev) => {
      // Skip if value hasn't changed to prevent unnecessary fetches
      if (prev[key] === value) return prev

      // Determine if this is a filter change (not pagination)
      const isFilterChange = key !== 'page' && key !== 'limit'

      return {
        ...prev,
        [key]: value,
        // Reset to first page whenever any filter changes
        ...(isFilterChange && { page: 1 }),
      }
    })
    setError(null)
  }, [])

  /**
   * Reset all filters to initial state
   */
  const resetFilters = useCallback(() => {
    setQueryParams({
      page: 1,
      limit: pageSize,
      sort: initialSort,
      order: initialOrder,
      search: '',
      category: '',
      platform: '',
      productType: '',
    })
    setError(null)
  }, [initialSort, initialOrder, pageSize])

  /**
   * Fetch library data whenever query params change
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetchFn(queryParams)
        setData(response)
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to load library data'
        setError(errorMessage)
        toast.error(errorMessage)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [queryParams, fetchFn])

  return {
    queryParams,
    updateParam,
    resetFilters,
    data,
    loading,
    error,
  }
}
