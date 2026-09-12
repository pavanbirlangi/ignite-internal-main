'use client'

import { Play } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import type { Product } from '@/types/product'
import GalleryCarousel from './GalleryCarousel'
import { getProxyImageUrl } from '@/lib/utils'

interface GalleryProps {
  product: Product
  heading?: string
  featuredImage?: string
}

export default function Gallery({ product, heading, featuredImage }: GalleryProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null)

  const getYouTubeThumbnailUrl = (url: string) => {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]{11})/,
    )
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null
  }

  const {
    posterImage,
    filteredImages,
    gridImages,
    carouselImages,
    videoUrl,
    videoHost,
  } = useMemo(() => {
    const backgroundImageUrl = product.backgroundImage?.url

    const gallerySource = product.gallery || []

    const images = gallerySource
      .filter((item) => item.type === 'IMAGE')
      .map((item) => item.url)
      .filter((url) => url && url !== backgroundImageUrl && url !== featuredImage)

    const videoItem = gallerySource.find(
      (item) => item.type === 'EXTERNAL_VIDEO',
    )
    const videoUrl = videoItem?.url ?? null
    const videoHost = videoItem?.host ?? 'OTHER'
    const isYouTubeVideo =
      videoHost === 'YOUTUBE' || Boolean(videoUrl?.includes('youtu'))
    const videoThumbnail =
      videoItem?.previewImage ??
      (videoUrl && isYouTubeVideo ? getYouTubeThumbnailUrl(videoUrl) : null)

    // When video exists, use only video-specific thumbnail sources.
    const posterImage = videoUrl
      ? (videoThumbnail ?? undefined)
      : (images[0] ?? featuredImage ?? product.featuredImage?.url ?? undefined)

    const videoPreviewUrl = videoUrl ? (videoItem?.previewImage ?? null) : null

    const urlPathname = (url: string): string => {
      try {
        return new URL(url).pathname
      } catch {
        return url
      }
    }

    const filteredImages = images.filter((image) => {
      if (image === posterImage) return false
      if (videoPreviewUrl && urlPathname(image) === urlPathname(videoPreviewUrl)) return false
      return true
    })

    const gridImages = filteredImages.slice(0, 4)

    const carouselImages = videoUrl
      ? filteredImages
      : posterImage
        ? [posterImage, ...filteredImages]
        : filteredImages

    return {
      posterImage,
      filteredImages,
      gridImages,
      carouselImages,
      videoUrl,
      videoHost,
    }
  }, [product, featuredImage])

  const openCarousel = (imageUrl: string) => {
    const index = carouselImages.findIndex((image) => image === imageUrl)
    setActiveImageIndex(index >= 0 ? index : 0)
  }

  const handleVideoClick = () => {
    // If it's a YouTube video, we toggle isPlaying to show the iframe
    if (videoHost === 'YOUTUBE' || videoUrl?.includes('youtu')) {
      setIsPlaying(!isPlaying)
      return
    }

    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
      return
    }

    videoRef.current.play()
    setIsPlaying(true)
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]{11})/,
    )
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null
  }

  return (
    <div className="max-w-container mx-auto mt-8 mb-16 w-full px-4 md:mt-12 md:mb-20 md:px-0">
      <h2 className="text-muted-foreground mb-6 text-lg font-semibold md:text-[24px]">
        {heading ?? 'Gallery'}
      </h2>

      <div className="flex h-auto flex-col gap-4 lg:h-76.5 lg:flex-row">
        <div
          role="button"
          tabIndex={0}
          aria-label={
            videoUrl
              ? isPlaying
                ? 'Pause video'
                : 'Play video'
              : 'View full screen image'
          }
          className="group focus-visible:ring-primary relative aspect-video h-full w-full cursor-pointer overflow-hidden rounded-[6px] shadow-lg shadow-black/40 outline-none focus-visible:ring-2 lg:aspect-auto lg:w-1/2"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (videoUrl) {
                handleVideoClick()
              } else if (posterImage) {
                openCarousel(posterImage)
              }
            }
          }}
          onClick={() => {
            if (videoUrl) {
              handleVideoClick()
              return
            }

            if (posterImage) {
              openCarousel(posterImage)
            }
          }}
        >
          {videoUrl &&
            isPlaying &&
            (videoHost === 'YOUTUBE' || videoUrl?.includes('youtu')) ? (
            <iframe
              className="h-full w-full rounded-[6px]"
              src={getYouTubeEmbedUrl(videoUrl!)!}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <>
              {videoUrl ? (
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  poster={posterImage ?? undefined}
                  muted
                  loop
                  playsInline
                >
                  <source
                    src={videoUrl}
                    type={
                      videoUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4'
                    }
                  />
                </video>
              ) : (
                <Image
                  src={getProxyImageUrl(posterImage ?? '/images/product/cover.png')}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              )}

              <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />

              {videoUrl && !isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                    <Play
                      className="ml-1 text-white"
                      fill="currentColor"
                      size={28}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="no-scrollbar flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-1 lg:grid lg:w-1/2 lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:pb-0">
          {gridImages.map((img, index) => {
            const isLastBox = index === 3 && filteredImages.length > 4
            const extraCount = filteredImages.length - 4

            return (
              <button
                key={`${img}-${index}`}
                type="button"
                aria-label={
                  isLastBox
                    ? `View ${extraCount} more images`
                    : `View gallery image ${index + 1}`
                }
                onClick={() => openCarousel(img)}
                className="group focus-visible:ring-primary relative h-[110px] w-[190px] shrink-0 cursor-pointer snap-start overflow-hidden rounded-[6px] shadow-md shadow-black/40 outline-none focus-visible:ring-2 md:h-[150px] md:w-[260px] lg:h-full lg:w-full"
              >
                <Image
                  src={getProxyImageUrl(img)}
                  alt={`Gallery thumbnail ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  sizes="(max-width: 768px) 190px, (max-width: 1024px) 260px, 25vw"
                />
                {isLastBox ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px] transition-colors group-hover:bg-black/50">
                    <span className="text-xl font-bold text-white tracking-wider md:text-2xl transition-transform duration-300 group-hover:scale-105">
                      +{extraCount}
                    </span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <GalleryCarousel
        images={carouselImages}
        activeIndex={activeImageIndex}
        onClose={() => setActiveImageIndex(null)}
        onChangeIndex={(index) => setActiveImageIndex(index)}
      />
    </div>
  )
}
