'use client'

import { Button } from '../ui/button'
import Link from 'next/link'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

interface DiscoverByGenreProps {
  title: string
  genres: Array<{
    id: number
    name: string
    icon: string
    to?: string
  }>
}

export default function DiscoverByGenre({
  title,
  genres,
}: DiscoverByGenreProps) {
  return (
    <section className="container flex flex-col gap-8">
      <h2 className="trim text-lg font-bold md:text-[20px] lg:text-2xl">{title}</h2>

      <div className="relative w-full">
        <Carousel opts={{ align: 'start', loop: true }} className="w-full">
          <CarouselContent className="-ml-3 md:-ml-4">
            {genres.map(({ id, name, icon, to }) => (
              <CarouselItem key={id} className="basis-auto pl-3 md:pl-4">
                <Button
                  asChild
                  size="lg"
                  className="flex h-24 min-w-40 shrink-0 flex-col items-center gap-2 rounded-[1.25rem] px-6 py-4 transition"
                >
                  <Link href={to || '#'}>
                    <div
                      className="size-8 [&>svg]:size-full"
                      dangerouslySetInnerHTML={{ __html: icon }}
                    />
                    <span className="trim text-sm font-medium md:text-base">
                      {name}
                    </span>
                  </Link>
                </Button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden lg:block">
            <CarouselPrevious className="absolute top-1/2 -left-14 -translate-y-1/2" />
            <CarouselNext className="absolute top-1/2 -right-14 -translate-y-1/2" />
          </div>
        </Carousel>
      </div>
    </section>
  )
}
