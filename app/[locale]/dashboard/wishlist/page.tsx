'use client'
import { Heart, Search } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  ACCOUNT_CARD_CLASS,
  ACCOUNT_PRIMARY_BUTTON_CLASS,
  ACCOUNT_SEARCH_INPUT_CLASS,
  AccountPageHeader,
} from '@/components/library/account-ui'
import Pagination from '@/components/store/Pagination'
import { useCallback, useState } from 'react'
import { useWishlist } from '@/hooks/useWishlist'
import { useDebounce } from '@/hooks/useDebounce'
import StoreCard from '@/components/store/StoreCard'

const ITEMS_PER_PAGE = 10

const Wishlist = () => {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading } = useWishlist({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: debouncedSearch || undefined,
  })

  const wishlistItems = data?.products || []
  const totalPages = Math.max(data?.pagination.totalPages ?? 1, 1)

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages || page === currentPage) return
      setCurrentPage(page)
    },
    [currentPage, totalPages],
  )

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  return (
    <>
      <div>
        <AccountPageHeader title="Wishlist" />
        {(wishlistItems.length > 0 || search) && (
          <div className="relative mb-6 w-full sm:max-w-[520px]">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/45" />
            <input
              type="text"
              placeholder="Search your wishlist"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={ACCOUNT_SEARCH_INPUT_CLASS}
            />
          </div>
        )}

        <div className="grid grid-cols-2 justify-items-center gap-x-3.5 gap-y-6 sm:gap-x-4 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-card h-64 w-full animate-pulse rounded-2xl"
              />
            ))
          ) : wishlistItems.length > 0 ? (
            wishlistItems.map((wp) => (
              <StoreCard key={wp.id} product={wp} wishlisted />
            ))
          ) : (
            <div className={cn(ACCOUNT_CARD_CLASS, 'col-span-full w-full px-6 py-14 text-center')}>
              <div className="bg-secondary mx-auto mb-4 grid size-14 place-items-center rounded-2xl text-white/65">
                <Heart className="size-6" />
              </div>
              <p className="text-base font-bold text-white/95">
                {search ? 'No matches in your wishlist' : 'Your wishlist is empty'}
              </p>
              <p className="mx-auto mt-1.5 mb-5 max-w-xs text-sm! leading-5! text-white/65">
                {search
                  ? 'Try a different search.'
                  : 'Tap the heart on any game to save it here for later.'}
              </p>
              {!search && (
                <Link href="/store" className={ACCOUNT_PRIMARY_BUTTON_CLASS}>
                  Browse the store
                </Link>
              )}
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
