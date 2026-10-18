'use client'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import type { ProductListItem } from '@/types/product'
import StoreCard from '../store/StoreCard'
import { PRODUCT_CONTAINER_CLASS } from '@/components/product/hero-section/ProductHero'

interface SimilarGamesProps {
  products: ProductListItem[]
  title?: string
}

// Same carousel, card widths and side arrows as the home page game rows.
export default function SimilarGames({ products, title }: SimilarGamesProps) {
  if (!products.length) {
    return null
  }

  return (
    <section className={PRODUCT_CONTAINER_CLASS}>
      <h2 className="mb-5 text-xl leading-[26px] font-bold text-white/95 md:text-2xl md:leading-[30px]">
        {title ?? 'Similar to this'}
      </h2>
      <Carousel
        opts={{ align: 'start', loop: true }}
        className="group/carousel w-full"
      >
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="basis-[58%] sm:basis-[38%] md:basis-1/3 lg:basis-1/5"
            >
              <StoreCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden lg:block">
          <CarouselPrevious className="absolute top-1/2 -left-14 -translate-y-1/2" />
          <CarouselNext className="absolute top-1/2 -right-14 -translate-y-1/2" />
        </div>
      </Carousel>
    </section>
  )
}
