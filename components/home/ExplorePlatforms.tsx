'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

interface ExplorePlatformsProps {
  title: string
  platforms: Array<{
    id: number
    name: string
    href?: string
    image: string
    to?: string
  }>
}

export default function ExplorePlatforms({
  title,
  platforms,
}: ExplorePlatformsProps) {
  return (
    <section className="container flex flex-col gap-8">
      <h2 className="trim text-lg font-bold md:text-[20px] lg:text-2xl">{title}</h2>

      <div className="relative w-full">
        <Carousel opts={{ align: 'start', loop: true }} className="w-full">
          <CarouselContent className="-ml-3 md:-ml-4">
            {platforms.map(({ id, name, href, image, to }) => {
              const imageUrl = `${process.env.NEXT_PUBLIC_CMS_API_URL}/assets/${image}`
              return (
                <CarouselItem key={id} className="basis-auto pl-3 md:pl-4">
                  <Link
                    className="bg-muted flex h-27.5 w-52.5 shrink-0 items-center justify-center rounded-2xl transition hover:brightness-125 hover:contrast-125"
                    href={to || href || '#'}
                    title={name}
                  >
                    <Image
                      src={imageUrl}
                      alt={name}
                      width={210}
                      height={110}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  </Link>
                </CarouselItem>
              )
            })}
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
