'use client'

import { getProxyImageUrl } from '@/lib/utils'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect } from 'react'

interface GalleryCarouselProps {
  images: string[]
  activeIndex: number | null
  onClose: () => void
  onChangeIndex: (index: number) => void
}

export default function GalleryCarousel({
  images,
  activeIndex,
  onClose,
  onChangeIndex,
}: GalleryCarouselProps) {
  useEffect(() => {
    if (activeIndex === null) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (!images.length) return

      if (event.key === 'ArrowRight') {
        onChangeIndex((activeIndex + 1) % images.length)
      }

      if (event.key === 'ArrowLeft') {
        onChangeIndex((activeIndex - 1 + images.length) % images.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, images, onChangeIndex, onClose])

  if (activeIndex === null || !images[activeIndex]) {
    return null
  }

  const goToNextImage = () => {
    if (!images.length) return
    onChangeIndex((activeIndex + 1) % images.length)
  }

  const goToPreviousImage = () => {
    if (!images.length) return
    onChangeIndex((activeIndex - 1 + images.length) % images.length)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close gallery"
        onClick={onClose}
        className="text-foreground/80 hover:text-foreground absolute top-6 right-6 z-10 rounded-full p-2 transition-colors"
      >
        <X size={28} />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(event) => {
              event.stopPropagation()
              goToPreviousImage()
            }}
            className="text-foreground/80 hover:text-foreground absolute left-6 rounded-full p-2 transition-colors"
          >
            <ChevronLeft size={36} />
          </button>

          <button
            type="button"
            aria-label="Next image"
            onClick={(event) => {
              event.stopPropagation()
              goToNextImage()
            }}
            className="text-foreground/80 hover:text-foreground absolute right-6 rounded-full p-2 transition-colors"
          >
            <ChevronRight size={36} />
          </button>
        </>
      )}

      <div
        className="mx-auto flex w-full max-w-6xl flex-col gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={getProxyImageUrl(images[activeIndex])}
          alt={`Gallery preview ${activeIndex + 1}`}
          className="max-h-[78vh] w-full rounded-[6px] object-contain"
        />

        {images.length > 1 && (
          <div className="flex justify-center gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => onChangeIndex(index)}
                className={`h-14 w-24 overflow-hidden rounded-[6px] border transition-opacity ${
                  index === activeIndex
                    ? 'border-foreground opacity-100'
                    : 'border-border opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={getProxyImageUrl(image)}
                  alt={`Thumbnail ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
