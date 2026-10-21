'use client'

import { KeyRound } from 'lucide-react'
import { cn, getProxyImageUrl } from '@/lib/utils'
import { ACCOUNT_PRIMARY_BUTTON_CLASS } from '@/components/library/account-ui'
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
  actionLabel = 'View Key',
}: OrderDetailItemProps) {
  const productHref = productHandle
    ? `/${encodeURIComponent(productHandle)}`
    : null

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="bg-secondary relative h-20 w-15 shrink-0 overflow-hidden rounded-md">
          <Image src={getProxyImageUrl(image)} alt={title} fill sizes="60px" className="object-cover" />
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          {productHref ? (
            <Link
              href={productHref}
              className="line-clamp-2 text-base font-bold text-white/95 hover:underline"
            >
              {title}
            </Link>
          ) : (
            <h3 className="line-clamp-2 text-base font-bold text-white/95">{title}</h3>
          )}
          {variantTitle && (
            <span className="text-xs font-medium text-white/65">{variantTitle}</span>
          )}
          <span className="text-sm text-white/65">
            {price} · Qty {quantity}
          </span>
          {tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-white/8 px-2 py-1 text-xs font-medium text-white/65"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {onReveal && (
        <button
          type="button"
          onClick={onReveal}
          className={cn(ACCOUNT_PRIMARY_BUTTON_CLASS, 'w-full sm:w-auto')}
        >
          <KeyRound />
          {actionLabel}
        </button>
      )}
    </div>
  )
}
