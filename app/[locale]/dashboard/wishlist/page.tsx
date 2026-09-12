'use client'
import { Search } from 'lucide-react'
import Pagination from '@/components/store/Pagination'
import { useCallback, useState } from 'react'
import { useWishlist } from '@/hooks/useWishlist'
import { useDebounce } from '@/hooks/useDebounce'
import { mapWishlistProductToProduct } from '@/lib/mappers/wishlist.mapper'
import StoreCard from '@/components/store/StoreCard'

const ITEMS_PER_PAGE = 10

const Wishlist = () => {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const [currentPage, setCurrentPage] = useState(1)
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([
    undefined,
  ])

  const activeCursor = cursorHistory[currentPage - 1]

  const { data, isLoading } = useWishlist({
    first: ITEMS_PER_PAGE,
    after: activeCursor,
    search: debouncedSearch || undefined,
  })

  const wishlistItems = data?.items || []
  const totalCount = data?.pageInfo.totalCount || 0
  const hasNextPage = data?.pageInfo.hasNextPage ?? false
  const endCursor = data?.pageInfo.endCursor ?? null
  const totalPages = Math.max(Math.ceil(totalCount / ITEMS_PER_PAGE), 1)

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages || page === currentPage) return

      if (page === currentPage + 1 && hasNextPage && endCursor) {
        setCursorHistory((prev) => {
          const updated = [...prev]
          if (!updated[page - 1]) {
            updated[page - 1] = endCursor
          }
          return updated
        })
        setCurrentPage(page)
      } else if (page < currentPage && cursorHistory[page - 1] !== undefined) {
        setCurrentPage(page)
      } else if (page === 1) {
        setCurrentPage(1)
      }
    },
    [currentPage, totalPages, hasNextPage, endCursor, cursorHistory],
  )

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
    setCursorHistory([undefined])
  }

  return (
    <>
      <div className="flex flex-col gap-12">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <h1 className="text-[28px] font-semibold md:text-[40px]">Wishlist</h1>
          <div className="relative w-full sm:max-w-130.5">
            <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search here"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="border-muted-foreground/40 text-foreground placeholder:text-muted-foreground focus:border-primary h-12.5 w-full rounded-full border bg-transparent pr-4 pl-10 text-sm transition-colors outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 justify-items-center gap-x-3.5 gap-y-6 sm:gap-x-4 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-secondary/20 h-64 w-full animate-pulse rounded-2xl"
              />
            ))
          ) : wishlistItems.length > 0 ? (
            wishlistItems.map((wp) => (
              <StoreCard
                key={wp.id}
                product={mapWishlistProductToProduct(wp)}
                wishlisted
              />
            ))
          ) : (
            <div className="text-muted-foreground col-span-full flex h-72 items-center justify-center text-center">
              Your wishlist is empty.
            </div>
          )}
        </div>
      </div>
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center md:mt-14">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  )
}

export default Wishlist
