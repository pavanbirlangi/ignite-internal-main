'use client'

import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import type { Product } from '@/types/product'
import GalleryCarousel from './GalleryCarousel'
import { PRODUCT_CONTAINER_CLASS } from '@/components/product/hero-section/ProductHero'
import { getProxyImageUrl } from '@/lib/utils'

interface GalleryProps {
  product: Product
  heading?: string
  featuredImage?: string
}

const YOUTUBE_ID = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]{11})/

const TILE_CLASS =
  'group focus-visible:ring-primary relative aspect-video w-[300px] shrink-0 snap-start overflow-hidden rounded-xl bg-white/5 outline-none focus-visible:ring-2 md:w-[420px]'

// Trailer first, then screenshots, in one swipeable row. Screenshots open the full-screen viewer;
// the trailer plays in its tile.
export default function Gallery({ product, heading, featuredImage }: GalleryProps) {
  const railRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null)

  const { images, video } = useMemo(() => {
    const backgroundUrl = product.backgroundImage?.url
    const items = product.gallery ?? []
    const images = items
      .filter((item) => item.type === 'IMAGE')
      .map((item) => item.url)
      .filter((url) => url && url !== backgroundUrl && url !== featuredImage)
    const videoItem = items.find((item) => item.type === 'EXTERNAL_VIDEO')
    if (!videoItem?.url) return { images, video: null }
    const youtubeId = videoItem.url.match(YOUTUBE_ID)?.[1] ?? null
    const isYouTube = videoItem.host === 'YOUTUBE' || Boolean(youtubeId)
    const poster =
      videoItem.previewImage ?? (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null)
    // A screenshot that is only the trailer's poster isn't shown twice.
    const posterPath = poster ? safePathname(poster) : null
    return {
      images: images.filter((url) => !posterPath || safePathname(url) !== posterPath),
      video: { url: videoItem.url, isYouTube, youtubeId, poster },
    }
  }, [product, featuredImage])

  if (!video && images.length === 0) return null

  const scrollRail = (direction: 1 | -1) =>
    railRef.current?.scrollBy({ left: direction * (railRef.current.clientWidth * 0.8), behavior: 'smooth' })

  const playVideo = () => {
    setIsPlaying(true)
    if (video && !video.isYouTube) videoRef.current?.play()
  }

  return (
    <section className={PRODUCT_CONTAINER_CLASS}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-xl leading-[26px] font-bold text-white/95 md:text-2xl md:leading-[30px]">
          {heading ?? 'Trailer & screenshots'}
        </h2>
        <div className="hidden gap-2 md:flex">
          {([-1, 1] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              onClick={() => scrollRail(direction)}
              aria-label={direction < 0 ? 'Previous' : 'Next'}
              className="grid size-9 cursor-pointer place-items-center rounded-full bg-white/6 text-white/65 transition-colors hover:bg-white/12 hover:text-white/95"
            >
              {direction < 0 ? <ChevronLeft className="size-4.5" /> : <ChevronRight className="size-4.5" />}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={railRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3.5 overflow-x-auto px-4 xl:mx-0 xl:scroll-px-0 xl:px-0"
      >
        {video &&
          (isPlaying && video.isYouTube && video.youtubeId ? (
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
            <button type="button" onClick={playVideo} aria-label="Play trailer" className={`${TILE_CLASS} cursor-pointer`}>
              {video.poster && (
                // YouTube thumbnails aren't an allowed image host, so they skip the optimizer.
                <Image src={video.poster} alt={`${product.title} trailer`} fill unoptimized className="object-cover" />
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
                <source src={video.url} type={video.url.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
              </video>
              {!isPlaying && (
                <button type="button" onClick={playVideo} aria-label="Play trailer" className="absolute inset-0 cursor-pointer">
                  <PlayBadge />
                </button>
              )}
            </div>
          ))}

        {images.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => setActiveImageIndex(index)}
            aria-label={`View screenshot ${index + 1}`}
            className={`${TILE_CLASS} cursor-pointer`}
          >
            <Image
              src={getProxyImageUrl(url)}
              alt={`${product.title} screenshot ${index + 1}`}
              fill
              loading="lazy"
              sizes="420px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      <GalleryCarousel
        images={images}
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
