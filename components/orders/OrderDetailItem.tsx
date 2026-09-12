'use client'

import { getProxyImageUrl } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

interface OrderDetailItemProps {
  image: string
  title: string
  productHandle?: string
  variantTitle?: string
  price: string
  quantity: number
  tags: string[]
  onReveal?: () => void
  actionLabel?: string
}

export function OrderDetailItem({
  image,
  title,
  productHandle,
  variantTitle,
  price,
  quantity,
  tags,
  onReveal,
  actionLabel = 'Reveal Key',
}: OrderDetailItemProps) {
  const productHref = productHandle
    ? `/${encodeURIComponent(productHandle)}`
    : null

  return (
    <div className="border-secondary text-card-foreground bg-secondary/20 mb-4 rounded-xl border p-4 shadow-sm backdrop-blur-[50px]">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        {/* Left Side: Image and Title */}
        <div className="flex flex-1 items-center gap-4">
          <div className="relative h-[100px] w-[80px] shrink-0 overflow-hidden rounded-md">
            <Image src={getProxyImageUrl(image)} alt={title} fill className="object-cover" />
          </div>

          <div className="flex flex-col gap-1.5 md:max-w-[400px]">
            <div className="flex flex-col gap-0.5">
              {productHref ? (
                <Link
                  href={productHref}
                  className="hover:underline line-clamp-2 max-w-[500px] text-[16px] leading-snug font-semibold text-white transition-all md:text-[18px]"
                >
                  {title}
                </Link>
              ) : (
                <h3 className="line-clamp-2 max-w-[500px] text-[16px] leading-snug font-semibold text-white md:text-[18px]">
                  {title}
                </h3>
              )}
              {variantTitle && (
                <p className="text-muted-foreground text-[11px] leading-none font-medium sm:text-xs">
                  {variantTitle}
                </p>
              )}
            </div>
            <div className="flex items-end gap-3">
              <span className="text-[18px] font-bold text-white">{price}</span>
              <span className="text-muted-foreground font-medium mb-1 text-xs">
                x{quantity}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Tags and Button */}
        <div className="mt-2 flex flex-col items-end gap-4 md:mt-0">
          <div className="flex gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-white/20 bg-transparent px-3 py-2 text-[10px] font-semibold text-white uppercase"
              >
                {tag}
              </span>
            ))}
          </div>

          {onReveal && (
            <button
              onClick={onReveal}
              className="bg-primary hover:bg-primary h-10 w-full cursor-pointer rounded-[6px] px-6 py-3 text-sm font-semibold text-white transition-colors md:w-auto"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
