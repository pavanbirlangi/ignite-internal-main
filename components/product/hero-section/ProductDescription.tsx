'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { Product } from '@/types/product'

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

export default function ProductDescription({
  product,
  labels,
  translatedDescriptionHtml,
}: ProductDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [areTagsExpanded, setAreTagsExpanded] = useState(false)
  const [shouldShowToggle, setShouldShowToggle] = useState(false)
  const descriptionRef = useRef<HTMLDivElement>(null)

  const heading = labels?.heading ?? 'Product Description'
  const readMore = labels?.readMore ?? 'Read more'
  const readLess = labels?.readLess ?? 'Read less'
  const descriptionHtml = translatedDescriptionHtml ?? product.descriptionHtml
  const tags = product.tags ?? []
  const visibleTags = areTagsExpanded ? tags : tags.slice(0, 5)
  const hasHiddenTags = tags.length > 5

  useEffect(() => {
    const element = descriptionRef.current
    if (!element) return

    const collapsedHeight = 128

    const updateOverflowState = () => {
      setShouldShowToggle(element.scrollHeight > collapsedHeight + 1)
    }

    updateOverflowState()

    const observer = new ResizeObserver(updateOverflowState)
    observer.observe(element)

    return () => observer.disconnect()
  }, [descriptionHtml])

  useEffect(() => {
    if (!shouldShowToggle && isExpanded) {
      setIsExpanded(false)
    }
  }, [isExpanded, shouldShowToggle])

  return (
    <div className="max-w-container text-muted-foreground mx-auto w-full px-4 md:px-0">
      {/* Section Header */}
      <h2 className="text-muted-foreground mb-2 text-[18px] font-semibold md:text-[20px]">
        {heading}
      </h2>

      {/* Main Title */}
      <h3 className="mt-3 mb-4 text-lg font-semibold text-white md:text-xl">
        {product.title}
      </h3>

      {/* Platform Tags */}
      {tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="border-muted-foreground text-muted-foreground cursor-default rounded-md border px-2 py-1.5 text-xs transition-colors hover:border-white/40"
            >
              {tag}
            </span>
          ))}
          {hasHiddenTags && (
            <button
              type="button"
              onClick={() => setAreTagsExpanded((prev) => !prev)}
              className="border-muted-foreground text-muted-foreground rounded-md border px-2 py-1.5 text-xs transition-colors hover:border-white/40 hover:text-white"
              aria-label={areTagsExpanded ? 'Hide extra tags' : 'Show more tags'}
            >
              ...
            </button>
          )}
        </div>
      )}

      {/* Description (HTML from API) */}
      <div
        ref={descriptionRef}
        className={`prose prose-invert prose-sm text-muted-foreground mb-8 max-w-none overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-none' : 'max-h-44'
        }`}
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
      />

      {/* Toggle Button */}
      {shouldShowToggle && (
        <div className="flex w-full justify-center border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:text-muted-foreground flex cursor-pointer items-center gap-2 text-sm font-semibold text-white transition-colors"
          >
            {isExpanded ? (
              <>
                {readLess}
                <ChevronUp size={16} />
              </>
            ) : (
              <>
                {readMore}
                <ChevronDown size={16} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
