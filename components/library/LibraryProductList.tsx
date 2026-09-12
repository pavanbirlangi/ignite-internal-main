import { Loader2 } from 'lucide-react'
import { PurchasedProduct } from '@/components/library/ProductCard'
import Pagination from '@/components/store/Pagination'
import type { LibraryResponse, LibraryItem } from '@/types/library'

interface LibraryProductListProps {
  data: LibraryResponse | null
  loading: boolean
  currentPage: number
  onPageChange: (page: number) => void
  onViewKey: (item: LibraryItem) => void
  onRateProduct: (item: LibraryItem) => void
}

export function LibraryProductList({
  data,
  loading,
  currentPage,
  onPageChange,
  onViewKey,
  onRateProduct,
}: LibraryProductListProps) {
  // Loading state - shows spinner in the middle of screen
  if (loading && !data) {
    return (
      <div className="mt-16 flex h-40 w-full items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Empty state - no products found
  if (!loading && data?.items.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center justify-center text-center">
        <div className="bg-secondary mb-4 rounded-full p-6">
          <svg
            className="text-muted-foreground h-12 w-12 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white">No products found</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          We couldn't find any products in your library matching your current
          filters.
        </p>
      </div>
    )
  }

  // Product list with loading overlay
  return (
    <>
      {data && data.items.length > 0 && (
        <div className="relative mt-8 flex flex-col gap-6">
          {loading && (
            <div className="bg-background/50 absolute inset-0 z-10 flex items-center justify-center rounded-xl backdrop-blur-sm">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          )}
          {data.items.map((item, index) => (
            <PurchasedProduct
              key={`${item.orderId}-${item.productId}-${index}`}
              item={item}
              onViewKey={() => onViewKey(item)}
              onRateProduct={() => onRateProduct(item)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="mt-10">
          <Pagination
            currentPage={currentPage}
            totalPages={data.pagination.totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  )
}
