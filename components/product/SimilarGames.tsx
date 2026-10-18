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

const ARROW_CLASS =
  'static size-9 translate-y-0 border-none bg-white/6 text-white/65 hover:bg-white/12 hover:text-white/95 [&>svg]:size-4.5'

export default function SimilarGames({ products, title }: SimilarGamesProps) {
  if (!products.length) {
    return null
  }

  return (
    <section className={PRODUCT_CONTAINER_CLASS}>
      <Carousel opts={{ align: 'start', loop: true }} className="w-full">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-xl leading-[26px] font-bold text-white/95 md:text-2xl md:leading-[30px]">
            {title ?? 'Similar to this'}
          </h2>
          <div className="hidden gap-2 md:flex">
            <CarouselPrevious className={ARROW_CLASS} />
            <CarouselNext className={ARROW_CLASS} />
          </div>
        </div>
        <CarouselContent className="-ml-3.5">
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="basis-[60%] pl-3.5 sm:basis-[40%] md:basis-1/3 lg:basis-1/5"
            >
              <StoreCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  )
}
