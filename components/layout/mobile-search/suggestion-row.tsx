import { memo } from 'react'
import Image from 'next/image'
import { getProductImage, getProductPrice } from '@/lib/search/search-utils'
import type { SuggestionRowProps } from '@/types/MobileSearchTypes'
import { HighlightedText } from './highlighted-text'

export const SuggestionRow = memo(function SuggestionRow({
  product,
  query,
  onSelect,
}: SuggestionRowProps) {
  const imageUrl = getProductImage(product)
  const { current, original } = getProductPrice(product)

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="bg-secondary/20 flex w-full items-center gap-6 rounded-[8px] p-3 text-left transition-colors hover:bg-white/10 focus:bg-white/10 focus:outline-none"
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

      <div className="flex flex-1 flex-col justify-center gap-[16px]">
        <p className="font-cooper line-clamp-2 max-w-[248px] text-[14px] leading-[18px] font-bold text-white">
          <HighlightedText text={product.title} query={query} />
        </p>

        {current && (
          <div className="flex items-center gap-[4px]">
            <span className="font-cooper text-sm font-semibold text-white">
              {current}
            </span>
            {original && (
              <span className="text-muted-foreground font-cooper text-sm font-semibold line-through">
                {original}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  )
})
