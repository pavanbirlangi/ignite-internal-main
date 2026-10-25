'use client'

import { Play } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import type { Product } from '@/types/product'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import GalleryCarousel from './GalleryCarousel'
import { PRODUCT_CONTAINER_CLASS } from '@/components/product/hero-section/ProductHero'
import { getProxyImageUrl } from '@/lib/utils'

interface GalleryProps {
  product: Product
  heading?: string
  featuredImage?: string
}

const YOUTUBE_ID =
  /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]{11})/

const TILE_CLASS =
  'group focus-visible:ring-primary relative block aspect-video w-[300px] shrink-0 overflow-hidden rounded-xl bg-white/5 outline-none focus-visible:ring-2 md:w-[420px]'

// Trailer first, then screenshots, in one swipeable row. Screenshots open the full-screen viewer;
// the trailer plays in its tile.
export default function Gallery({
  product,
  heading,
  featuredImage,
}: GalleryProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null)

  const { images, altByUrl, video } = useMemo(() => {
    const backgroundUrl = product.backgroundImage?.url
    const items = product.gallery ?? []
    const shots = items
      .filter((item) => item.type === 'IMAGE')
      .filter((item) => item.url && item.url !== backgroundUrl && item.url !== featuredImage)
    const images = shots.map((item) => item.url)
    // R-101: the alt text set in the admin's Media page; null when it's only the product title.
    const altByUrl = new Map(
      shots.map((item) => [item.url, item.altText && item.altText !== product.title ? item.altText : null]),
    )
    const videoItem = items.find((item) => item.type === 'EXTERNAL_VIDEO')
    if (!videoItem?.url) return { images, altByUrl, video: null }
    const youtubeId = videoItem.url.match(YOUTUBE_ID)?.[1] ?? null
    const isYouTube = videoItem.host === 'YOUTUBE' || Boolean(youtubeId)
    const poster =
      videoItem.previewImage ??
      (youtubeId
        ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
        : null)
    // A screenshot that is only the trailer's poster isn't shown twice.
    const posterPath = poster ? safePathname(poster) : null
    return {
      images: images.filter(
        (url) => !posterPath || safePathname(url) !== posterPath,
      ),
      altByUrl,
      video: { url: videoItem.url, isYouTube, youtubeId, poster },
    }
  }, [product, featuredImage])

  if (!video && images.length === 0) return null

  const playVideo = () => {
    setIsPlaying(true)
    if (video && !video.isYouTube) videoRef.current?.play()
  }

  return (
    <section className={PRODUCT_CONTAINER_CLASS}>
      <h2 className="mb-5 text-xl leading-[26px] font-bold text-white/95 md:text-2xl md:leading-[30px]">
        {heading ?? 'Trailer & screenshots'}
      </h2>

      {/* Same carousel and side arrows as the home page rows. */}
      <Carousel opts={{ align: 'start' }} className="w-full">
        <CarouselContent>
          {video && (
            <CarouselItem className="basis-auto">
              {isPlaying && video.isYouTube && video.youtubeId ? (
                <div className={TILE_CLASS}>
                  <iframe
                    className="absolute inset-0 size-full"
                    src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                    title={`${product.title} trailer`}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              ) : video.isYouTube ? (
                <button
                  type="button"
                  onClick={playVideo}
                  aria-label="Play trailer"
                  className={`${TILE_CLASS} cursor-pointer`}
                >
                  {video.poster && (
                    // YouTube thumbnails aren't an allowed image host, so they skip the optimizer.
                    <Image
                      src={video.poster}
                      alt={`${product.title} trailer`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  )}
                  <PlayBadge />
                </button>
              ) : (
                <div className={TILE_CLASS}>
                  <video
                    ref={videoRef}
                    className="absolute inset-0 size-full object-cover"
                    poster={video.poster ?? undefined}
                    controls={isPlaying}
                    playsInline
                  >
                    <source
                      src={video.url}
                      type={
                        video.url.endsWith('.webm') ? 'video/webm' : 'video/mp4'
                      }
                    />
                  </video>
                  {!isPlaying && (
                    <button
                      type="button"
                      onClick={playVideo}
                      aria-label="Play trailer"
                      className="absolute inset-0 cursor-pointer"
                    >
                      <PlayBadge />
                    </button>
                  )}
                </div>
              )}
            </CarouselItem>
          )}

          {images.map((url, index) => (
            <CarouselItem key={`${url}-${index}`} className="basis-auto">
              <button
                type="button"
                onClick={() => setActiveImageIndex(index)}
                aria-label={`View screenshot ${index + 1}`}
                className={`${TILE_CLASS} cursor-pointer`}
              >
                <Image
                  src={getProxyImageUrl(url)}
                  alt={altByUrl.get(url) ?? `${product.title} screenshot ${index + 1}`}
                  fill
                  loading="lazy"
                  sizes="420px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden lg:block">
          <CarouselPrevious className="absolute top-1/2 -left-14 -translate-y-1/2" />
          <CarouselNext className="absolute top-1/2 -right-14 -translate-y-1/2" />
        </div>
      </Carousel>

      <GalleryCarousel
        images={images}
        alts={images.map((url, index) => altByUrl.get(url) ?? `${product.title} screenshot ${index + 1}`)}
        activeIndex={activeImageIndex}
        onClose={() => setActiveImageIndex(null)}
        onChangeIndex={setActiveImageIndex}
      />
    </section>
  )
}

function PlayBadge() {
  return (
    <span className="absolute inset-0 grid place-items-center bg-black/10">
      <span className="grid size-14 place-items-center rounded-full border border-white/35 bg-white/20 backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
        <Play className="ml-0.5 size-6 text-white" fill="currentColor" />
      </span>
    </span>
  )
}

function safePathname(url: string) {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}
