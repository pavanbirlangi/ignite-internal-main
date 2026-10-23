'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ShoppingCart } from 'lucide-react'
import GameCarouselSection from '@/components/shared/GameCarouselSection'
import { ACCOUNT_PRIMARY_BUTTON_CLASS } from '@/components/library/account-ui'
import { useWishlist } from '@/hooks/useWishlist'
import { useUserStore } from '@/store/useUserStore'
import { isListItemBuyable } from '@/lib/utils/list-item-stock'
import { getProxyImageUrl } from '@/lib/utils'
import type { ProductListItem } from '@/types/product'

const WISHLIST_COVERS = 3

// Signed-in customers with saved games get a way back to them; everyone else sees nothing here.
function WishlistShortcut() {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)
  const { data } = useWishlist({ limit: WISHLIST_COVERS }, isAuthenticated)
  const count = data?.pagination.totalItems ?? 0
  if (!isAuthenticated || count === 0) return null

  const covers = (data?.products ?? [])
    .map((product) => product.featuredImage?.url ?? product.image)
    .filter((url): url is string => Boolean(url))
    .slice(0, WISHLIST_COVERS)

  return (
    <Link
      href="/dashboard/wishlist"
      className="bg-background border-border flex w-full max-w-md items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors hover:border-white/20"
    >
      {covers.length > 0 && (
        <span className="flex shrink-0">
          {covers.map((url, index) => (
            <span
              key={url}
              className={`border-background relative h-10 w-[30px] overflow-hidden rounded-[5px] border-2 ${index > 0 ? '-ml-2' : ''}`}
            >
              <Image src={getProxyImageUrl(url)} alt="" fill sizes="30px" className="object-cover" />
            </span>
          ))}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-white/95">
          {count === 1 ? '1 game in your wishlist' : `${count} games in your wishlist`}
        </span>
        <span className="text-[13px] text-white/65">Pick up where you left off</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-white/65" />
    </Link>
  )
}

export function EmptyCartState({ featuredDeals = [] }: { featuredDeals?: ProductListItem[] }) {
  const deals = featuredDeals.filter(isListItemBuyable)

  return (
    <div className="flex flex-col gap-10">
      <div className="bg-card border-border flex flex-col items-center gap-4 rounded-2xl border px-5 py-8 text-center">
        <div className="bg-secondary flex h-14 w-14 items-center justify-center rounded-full text-white/65">
          <ShoppingCart className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white/95">Your cart is empty</h3>
          <p className="text-sm text-white/65">Looks like you haven&apos;t added any games yet.</p>
        </div>
        <Link href="/store" className={`${ACCOUNT_PRIMARY_BUTTON_CLASS} h-11 px-5`}>
          Browse the store
          <ArrowRight />
        </Link>
        <WishlistShortcut />
      </div>

      {deals.length > 0 && (
        <GameCarouselSection title="🔥 Featured Deals" games={deals} seeAllHref="/store" className="flex flex-col gap-6" />
      )}
    </div>
  )
}
