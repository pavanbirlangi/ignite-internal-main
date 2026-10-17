"use client"

import Image from "next/image"
import Link from "next/link"
import { Eye, Star } from "lucide-react"
import type { LibraryItem } from "@/types/library"
import { cn, getProxyImageUrl } from "@/lib/utils"
import {
  ACCOUNT_CARD_CLASS,
  ACCOUNT_PRIMARY_BUTTON_CLASS,
  ACCOUNT_SECONDARY_BUTTON_CLASS,
} from "./account-ui"

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
  const formattedDate = new Date(item.purchasedAt).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <div className={cn(ACCOUNT_CARD_CLASS, "px-4 py-4 sm:px-5")}>
      <p className="mb-3 text-xs! leading-4! font-medium text-white/65">
        Purchased on {formattedDate}
      </p>

      <div className="bg-border mb-4 h-px w-full" />

      <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div className="bg-secondary relative size-14 shrink-0 overflow-hidden rounded-md">
            <Image src={imageUrl} alt={item.title} fill sizes="56px" className="object-cover" />
          </div>

          <div className="flex min-w-0 flex-col gap-0.5">
            <h3 className="text-base font-bold text-white/95 md:max-w-[420px]" title={item.title}>
              <Link href={`/${item.handle}`} className="line-clamp-2 hover:underline">
                {item.title}
              </Link>
            </h3>
            {item.productType && (
              <span className="text-xs font-medium text-white/65">{item.productType}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onViewKey}
            className={cn(ACCOUNT_SECONDARY_BUTTON_CLASS, "flex-1 md:flex-none")}
          >
            <Eye />
            View Key
          </button>
          <button
            type="button"
            onClick={onRateProduct}
            className={cn(ACCOUNT_PRIMARY_BUTTON_CLASS, "flex-1 md:flex-none")}
          >
            <Star className="fill-current" />
            Rate Product
          </button>
        </div>
      </div>
    </div>
  )
}
