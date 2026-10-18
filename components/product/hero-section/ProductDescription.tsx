'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Product } from '@/types/product'
import { PRODUCT_CONTAINER_CLASS } from '@/components/product/hero-section/ProductHero'
import { cn } from '@/lib/utils'

interface ProductDescriptionProps {
  product: Product
  labels?: {
    heading?: string
    readMore?: string
    readLess?: string
  }
  translatedDescription?: string
  translatedDescriptionHtml?: string
}

const COLLAPSED_HEIGHT = 200

export default function ProductDescription({ product, labels, translatedDescriptionHtml }: ProductDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldShowToggle, setShouldShowToggle] = useState(false)
  const descriptionRef = useRef<HTMLDivElement>(null)

  const descriptionHtml = translatedDescriptionHtml ?? product.descriptionHtml
  const genres = product.genre ?? []

  useEffect(() => {
    const element = descriptionRef.current
    if (!element) return
    const update = () => setShouldShowToggle(element.scrollHeight > COLLAPSED_HEIGHT + 1)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [descriptionHtml])

  // A product without a description (several still have none) gets no empty section.
  if (!descriptionHtml?.replace(/<[^>]*>/g, '').trim()) return null

  const isCollapsed = shouldShowToggle && !isExpanded

  return (
    <section className={PRODUCT_CONTAINER_CLASS}>
      <h2 className="mb-5 text-xl leading-[26px] font-bold text-white/95 md:text-2xl md:leading-[30px]">
        {labels?.heading ?? 'About this game'}
      </h2>

      {genres.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {genres.map((genre) => (
            <span
              key={genre}
              className="inline-flex h-7 items-center rounded-full bg-white/7 px-3 text-xs font-medium text-white/65"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      <div className="relative max-w-190">
        <div
          ref={descriptionRef}
          style={isCollapsed ? { maxHeight: COLLAPSED_HEIGHT } : undefined}
          className="prose prose-invert prose-h2:text-base prose-h2:font-bold prose-h3:text-base prose-h3:font-bold prose-headings:text-white/95 prose-headings:mt-5 prose-headings:mb-1.5 prose-strong:font-bold max-w-none overflow-hidden text-sm leading-[22px] text-white/65 md:text-base md:leading-[26px]"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
        {isCollapsed && (
          <div
            aria-hidden
            className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-22 bg-gradient-to-t to-transparent"
          />
        )}
      </div>

      {shouldShowToggle && (
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          aria-expanded={isExpanded}
          className="mt-3.5 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-white/95 transition-colors hover:text-white/65"
        >
          {isExpanded ? (labels?.readLess ?? 'Read less') : (labels?.readMore ?? 'Read more')}
          <ChevronDown className={cn('size-4 transition-transform duration-200', isExpanded && 'rotate-180')} />
        </button>
      )}
    </section>
  )
}
