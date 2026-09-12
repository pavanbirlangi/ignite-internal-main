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

interface SimilarGamesProps {
  products: ProductListItem[]
  title?: string
}

export default function SimilarGames({ products, title }: SimilarGamesProps) {
  if (!products.length) {
    return null
  }

  return (
    <div className="bg-background mb-16 w-full py-6 md:mt-12 md:mb-20 md:py-10">
      <div className="max-w-container mx-auto w-full px-4 md:px-0">
        {/* Header */}
        <h2 className="mb-8 pl-1 text-lg font-semibold text-white/50 md:text-[24px]">
          {title ?? 'Similar to This'}
        </h2>

        {/* Carousel Container */}
        <div className="relative w-full">
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            className="group/carousel w-full"
          >
            <CarouselContent className="-ml-3 md:-ml-4">
              {products.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="basis-[60%] sm:basis-[40%] md:basis-[32%] lg:basis-[19.5%]"
                >
                  <StoreCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation Arrows */}
            <div className="hidden lg:block">
              <CarouselPrevious className="bg-secondary hover:bg-secondary absolute top-1/2 -left-16 h-11 w-11 -translate-y-1/2 border-none text-white/50 transition-all hover:text-white [&>svg]:h-5 [&>svg]:w-5" />
              <CarouselNext className="bg-secondary hover:bg-secondary absolute top-1/2 -right-16 h-11 w-11 -translate-y-1/2 border-none text-white/50 transition-all hover:text-white [&>svg]:h-5 [&>svg]:w-5" />
            </div>
          </Carousel>
        </div>
      </div>
    </div>
  )
}
