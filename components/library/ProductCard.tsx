"use client"

import Image from "next/image"
import Link from "next/link"
import { Eye, Star } from "lucide-react"
import type { LibraryItem } from "@/types/library"
import { getProxyImageUrl } from "@/lib/utils"

interface PurchasedProductProps {
  item: LibraryItem
  onViewKey: () => void
  onRateProduct: () => void
}

export function PurchasedProduct({
  item,
  onViewKey,
  onRateProduct,
}: PurchasedProductProps) {
  const imageUrl = getProxyImageUrl(item.featuredImage?.url) || "/images/product/cover.png"
  const formattedDate = new Date(item.purchasedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="rounded-xl border border-secondary p-4 text-card-foreground bg-secondary/20 shadow-sm backdrop-blur-[50px]">
      {/* Purchase date */}
      <div className="mb-4 text-sm text-muted-foreground">
        Purchased on {formattedDate}
      </div>

      <div className="h-px w-full bg-white/5 mb-4"></div>

      {/* Product card content */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Game cover - small square */}
          <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-md">
            <Image src={imageUrl} alt={item.title} fill className="object-cover" style={{ objectFit: 'cover' }} />
          </div>

          {/* Title */}
          <div className="flex flex-col">
            <h3 className="flex-1 text-[16px] md:text-[18px] font-semibold md:max-w-[400px] text-white" title={item.title}>
              <Link href={`/${item.handle}`} className="line-clamp-2 hover:underline">
                {item.title}
              </Link>
            </h3>
            {item.productType && (
              <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
                {item.productType}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 gap-3 mt-2 md:mt-0">
          <button
            onClick={onViewKey}
            className="flex flex-1 md:flex-none h-10 items-center justify-center gap-2 rounded-[6px] cursor-pointer border border-white/10 bg-transparent px-5 text-sm font-medium text-white transition-colors hover:bg-white/5"
          >
            <Eye className="h-4 w-4" />
            View Key
          </button>
          <button
            onClick={onRateProduct}
            className="flex flex-1 md:flex-none h-10 items-center justify-center gap-2 rounded-[6px] cursor-pointer bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary"
          >
            <Star className="h-4 w-4 fill-white" />
            Rate Product
          </button>
        </div>
      </div>
    </div>
  )
}
