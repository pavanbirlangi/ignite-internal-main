import { memo, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { getProductImage, getProductPrice } from '@/lib/search/search-utils'
import type { SearchSuggestionRowProps } from '@/types/SearchSuggestionTypes'
import { HighlightedText } from './highlighted-text'

// The row picked with the arrow keys: the same blue edge as the navbar's capsule.
export const ACTIVE_ROW_CLASS =
  'border-primary/60 bg-white/10 shadow-[0_0_20px_-6px_rgba(36,104,223,0.7)]'

export const SuggestionRow = memo(function SuggestionRow({
  product,
  query,
  onSelect,
  active = false,
  id,
  className,
  style,
}: SearchSuggestionRowProps) {
  const ref = useRef<HTMLButtonElement>(null)

  // Keep the arrow-key selection in view in a long list.
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const imageUrl = getProductImage(product)
  const { current, original } = getProductPrice(product)

  return (
    <button
      ref={ref}
      type="button"
      id={id}
      role="option"
      aria-selected={active}
      onClick={() => onSelect(product)}
      style={style}
      className={cn(
        'flex w-full items-center gap-4 rounded-lg border border-white/5 bg-white/5 p-3 text-left transition-[background-color,border-color,box-shadow] duration-200 hover:bg-white/10 focus:bg-white/10 focus:outline-none md:gap-5',
        active && ACTIVE_ROW_CLASS,
        className,
      )}
    >
      <div className="relative h-[79px] w-[62px] shrink-0 overflow-hidden rounded-[4px] bg-white/10">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={product.featuredImage?.altText || product.title}
            fill
            className="object-cover"
            sizes="62px"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 md:gap-4">
        <p className="line-clamp-2 text-sm font-bold text-white/95">
          <HighlightedText text={product.title} query={query} />
        </p>

        {current && (
          <div className="flex items-center gap-1.5 md:gap-2">
            <span className="text-sm font-bold text-white/95">{current}</span>
            {original && (
              <span className="text-white/65 text-sm font-medium line-through">
                {original}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  )
})
