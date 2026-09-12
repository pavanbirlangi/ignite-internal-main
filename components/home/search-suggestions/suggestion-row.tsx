import { memo } from 'react'
import Image from 'next/image'
import { getProductImage, getProductPrice } from '@/lib/search/search-utils'
import type { SearchSuggestionRowProps } from '@/types/SearchSuggestionTypes'
import { HighlightedText } from './highlighted-text'

export const SuggestionRow = memo(function SuggestionRow({
  product,
  query,
  onSelect,
}: SearchSuggestionRowProps) {
  const imageUrl = getProductImage(product)
  const { current, original } = getProductPrice(product)

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="flex w-full items-center gap-4 rounded-lg border border-white/5 bg-white/5 p-3 text-left transition-colors hover:bg-white/10 focus:bg-white/10 focus:outline-none md:gap-5"
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
        <p className="line-clamp-2 text-sm leading-[18px] font-semibold text-white">
          <HighlightedText text={product.title} query={query} />
        </p>

        {current && (
          <div className="flex items-center gap-1.5 md:gap-2">
            <span className="text-sm font-semibold text-white">{current}</span>
            {original && (
              <span className="text-muted-foreground text-sm font-medium line-through">
                {original}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  )
})
