'use client'

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

type GameCarouselSectionProps = {
  title: string
  games: ProductListItem[]
  seeAllHref?: string
  id?: string
}

export default function GameCarouselSection({
  title,
  games,
  seeAllHref,
  id,
}: GameCarouselSectionProps) {
  return (
    <section id={id} className="container flex flex-col gap-8">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="trim text-lg font-semibold md:text-[20px] lg:text-2xl">
          {title}
        </h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="trim text-muted-foreground hover:text-foreground font-medium underline transition-colors"
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
              {games.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="basis-[58%] sm:basis-[38%] md:basis-[32%] lg:basis-[19.5%]"
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
          <div className="flex h-40 w-full items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 text-sm text-white/50">
            No products available at the moment.
          </div>
        )}
      </div>
    </section>
  )
}
