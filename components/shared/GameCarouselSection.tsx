'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import type { ProductListItem } from '@/types/product'
import StoreCard from '../store/StoreCard'

// Cards rendered up front: a screenful even on desktop (5 visible) plus one. The rest are added
// once the carousel comes near the screen or is touched, so a page of several carousels doesn't
// build, send and hydrate every card (the homepage had 68; PageSpeed mobile: 1.7 s of React work).
const INITIAL_CARDS = 6

type GameCarouselSectionProps = {
  title: string
  games: ProductListItem[]
  seeAllHref?: string
  id?: string
  // Replaces the page-width container, for use inside a page's own column.
  className?: string
}

export default function GameCarouselSection({
  title,
  games,
  seeAllHref,
  id,
  className = 'container flex flex-col gap-8',
}: GameCarouselSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [showAll, setShowAll] = useState(games.length <= INITIAL_CARDS)

  useEffect(() => {
    if (showAll) return
    const section = sectionRef.current
    if (!section || typeof IntersectionObserver === 'undefined') {
      setShowAll(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setShowAll(true)
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [showAll])

  const visibleGames = showAll ? games : games.slice(0, INITIAL_CARDS)

  return (
    <section
      ref={sectionRef}
      id={id}
      className={className}
      onPointerDown={showAll ? undefined : () => setShowAll(true)}
      onFocusCapture={showAll ? undefined : () => setShowAll(true)}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="trim text-xl font-bold md:text-2xl lg:text-3xl">
          {title}
        </h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="trim text-white/65 hover:text-foreground font-medium underline transition-colors"
          >
            see all
          </Link>
        )}
      </div>

      {/* Game Carousel */}
      <div className="relative w-full">
        {games.length > 0 ? (
          <Carousel
            opts={{ align: 'start', loop: true }}
            className="group/carousel w-full"
          >
            <CarouselContent>
              {visibleGames.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="basis-[42%] sm:basis-[38%] md:basis-1/3 lg:basis-1/5"
                >
                  <StoreCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation Arrows */}
            <div className="hidden lg:block">
              <CarouselPrevious className="absolute top-1/2 -left-14 -translate-y-1/2" />
              <CarouselNext className="absolute top-1/2 -right-14 -translate-y-1/2" />
            </div>
          </Carousel>
        ) : (
          <div className="flex h-40 w-full items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 text-sm text-white/65">
            No products available at the moment.
          </div>
        )}
      </div>
    </section>
  )
}
