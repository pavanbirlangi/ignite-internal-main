'use client'

import { cn, getProxyImageUrl } from '@/lib/utils'
import {
  ACCOUNT_CARD_CLASS,
  ACCOUNT_SECONDARY_BUTTON_CLASS,
  MetaItem,
  StatusPill,
} from '@/components/library/account-ui'
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, type CustomerOrderStatus } from '@/lib/orders/order-status'
import Image from 'next/image'
import Link from 'next/link'

interface OrderCardProps {
  id: string
  detailId?: string
  productHandle?: string
  amount: string
  purchaseDate: string
  status: CustomerOrderStatus
  image: string
  title: string
  itemsCount?: number
  onViewDetails?: () => void
}

export function OrderCard({
  id,
  detailId,
  productHandle,
  amount,
  purchaseDate,
  status,
  image,
  title,
  itemsCount = 0,
  onViewDetails,
}: OrderCardProps) {
  const orderDetailsHref = `/dashboard/my-orders/${encodeURIComponent(detailId ?? id)}`
  const productHref = productHandle
    ? `/${encodeURIComponent(productHandle)}`
    : null

  const titleContent = (
    <>
      {title}
      {itemsCount > 0 && (
        <span className="ml-1.5 font-medium text-white/65">+ {itemsCount} more</span>
      )}
    </>
  )

  return (
    <div className={cn(ACCOUNT_CARD_CLASS, 'w-full min-w-0 px-4 py-4 sm:px-5')}>
      {/* Top row: order facts and status */}
      <div className="mb-4 flex flex-col-reverse items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <MetaItem label="Purchased on" value={purchaseDate} />
          <MetaItem label="Order Amount" value={amount} />
          <MetaItem label="Order ID" value={`#${id}`} />
        </div>
        <StatusPill tone={ORDER_STATUS_TONE[status]}>{ORDER_STATUS_LABEL[status]}</StatusPill>
      </div>

      <div className="bg-border mb-4 h-px w-full" />

      {/* Product and action */}
      <div className="flex w-full min-w-0 flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div className="bg-secondary relative h-16 w-12 shrink-0 overflow-hidden rounded-md">
            <Image src={getProxyImageUrl(image)} alt={title} fill sizes="48px" className="object-cover" />
          </div>

          {productHref ? (
            <Link
              href={productHref}
              className="min-w-0 flex-1 text-base font-bold text-white/95 transition-colors hover:underline md:max-w-[480px]"
            >
              <h3 className="line-clamp-2 wrap-break-word">{titleContent}</h3>
            </Link>
          ) : (
            <h3 className="min-w-0 flex-1 text-base font-bold wrap-break-word text-white/95 md:max-w-[480px]">
              {titleContent}
            </h3>
          )}
        </div>

        <Link
          href={orderDetailsHref}
          onClick={onViewDetails}
          className={cn(ACCOUNT_SECONDARY_BUTTON_CLASS, 'w-full md:w-auto')}
        >
          View Details
        </Link>
      </div>
    </div>
  )
}
