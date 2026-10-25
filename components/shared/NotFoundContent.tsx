'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Search } from 'lucide-react'
import GameCarouselSection from '@/components/shared/GameCarouselSection'
import { isListItemBuyable } from '@/lib/utils/list-item-stock'
import { openSiteSearch } from '@/lib/utils/open-search'
import { localizedHref } from '@/lib/utils'
import type { ProductListItem } from '@/types/product'

const PLATFORMS = [
  { name: 'PC', href: '/store?platform=pc' },
  { name: 'Xbox', href: '/store?platform=xbox' },
  { name: 'PlayStation', href: '/store?platform=playstation' },
  { name: 'Nintendo', href: '/store?platform=nintendo' },
]

const CHIP_CLASS =
  'bg-card border-border rounded-full border px-3.5 py-2 text-sm font-medium text-white/75 transition-colors hover:border-white/20 hover:text-white'
const LINK_CLASS = 'text-[#5B93F0] hover:underline'

// The 404: most visitors here followed an old game link (Shopify-era URLs, renamed products), so the
// page offers the site search first, platform shortcuts, and the Featured Deals row (as the empty
// cart does; sold-out deals left out).
export default function NotFoundContent({ featuredDeals = [] }: { featuredDeals?: ProductListItem[] }) {
  const { locale = 'en' } = useParams<{ locale?: string }>() ?? {}
  const href = (path: string) => localizedHref(locale, path)
  const deals = featuredDeals.filter(isListItemBuyable)

  return (
    <div className="flex flex-col gap-4 pb-16">
      <section className="container flex flex-col items-center px-4 pt-10 pb-8 text-center md:pt-14">
        <Image
          src="/images/404.png"
          alt=""
          width={220}
          height={220}
          className="h-28 w-auto md:h-38"
          priority
          unoptimized
        />
        <p className="mt-5 text-xs font-bold tracking-[1.2px] text-[#5B93F0] uppercase">Error 404</p>
        <h1 className="mt-2 text-2xl leading-tight font-bold text-white/95 md:text-3xl">This page isn&apos;t here</h1>
        <p className="mt-3 max-w-130 text-base text-white/65">
          The link may be old, or the product is no longer on sale. Search for the game you wanted, or pick a platform.
        </p>

        <button
          type="button"
          onClick={openSiteSearch}
          className="bg-card border-border mt-7 flex h-13 w-full max-w-140 cursor-text items-center gap-3 rounded-xl border px-4.5 text-left text-base text-white/45 transition-colors outline-none hover:border-white/20 focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <Search className="size-4.5 shrink-0" />
          <span className="truncate sm:hidden">Search games and more</span>
          <span className="hidden truncate sm:inline">Search games, gift cards and software</span>
        </button>

        <nav aria-label="Platforms" className="mt-4 flex flex-wrap justify-center gap-2">
          {PLATFORMS.map((platform) => (
            <Link key={platform.name} href={href(platform.href)} className={CHIP_CLASS}>
              {platform.name}
            </Link>
          ))}
        </nav>

        <p className="mt-5 text-sm text-white/65">
          <Link href={href('/store')} className={LINK_CLASS}>
            Browse the store
          </Link>
          {' · '}Need help?{' '}
          <Link href={href('/help')} className={LINK_CLASS}>
            Visit the Help centre
          </Link>
        </p>
      </section>

      {deals.length > 0 && (
        <GameCarouselSection title="🔥 Featured Deals" games={deals} seeAllHref={href('/store')} />
      )}
    </div>
  )
}
