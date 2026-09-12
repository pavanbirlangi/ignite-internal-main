'use client'

import { getProxyImageUrl } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

export type OrderStatus =
  | 'PAID'
  | 'FULFILLED'
  | 'UNFULFILLED'
  | 'PARTIALLY_FULFILLED'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'VOIDED'
  | 'CANCELLED'
  | 'SUCCESSFUL'
  | 'REFUND SUCCESSFUL'
  | 'REFUND INITIATED'

interface OrderCardProps {
  id: string
  detailId?: string
  productHandle?: string
  amount: string
  purchaseDate: string
  status: OrderStatus
  image: string
  title: string
  itemsCount?: number
  onViewDetails?: () => void
}

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'PAID':
    case 'FULFILLED':
    case 'SUCCESSFUL':
      return 'bg-destructive text-white'
    case 'CANCELLED':
    case 'VOIDED':
      return 'bg-red text-white'
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
    case 'REFUND SUCCESSFUL':
      return 'bg-primary text-white'
    case 'PENDING':
    case 'AUTHORIZED':
    case 'UNFULFILLED':
    case 'PARTIALLY_FULFILLED':
    case 'REFUND INITIATED':
      return 'bg-accent text-white'
    default:
      return 'bg-secondary text-muted-foreground'
  }
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

  return (
    <div className="border-secondary text-card-foreground bg-secondary/20 w-full min-w-0 rounded-xl border px-5 py-3 shadow-sm backdrop-blur-[50px]">
      {/* Top Row: Meta Data & Status */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-wrap gap-8 text-sm font-medium">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Purchased on</span>
            <span className="font-semibold text-white">{purchaseDate}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Order Amount</span>
            <span className="font-semibold text-white">{amount}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Order ID</span>
            <span className="font-semibold text-white">#{id}</span>
          </div>
        </div>

        <div
          className={`w-fit rounded px-3 py-1 text-xs font-bold uppercase ${getStatusColor(status)}`}
        >
          {status}
        </div>
      </div>

      <div className="mb-6 h-px w-full bg-white/5"></div>

      {/* Product Content */}
      <div className="flex w-full min-w-0 flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative h-20 w-15.5 shrink-0 overflow-hidden rounded-md">
            <Image src={getProxyImageUrl(image)} alt={title} fill className="object-cover" />
          </div>

          {productHref ? (
            <Link
              href={productHref}
              className="min-w-0 flex-1 text-[16px] font-semibold text-white transition-colors hover:underline md:max-w-100 md:text-[18px]"
            >
              <h3 className="line-clamp-2 wrap-break-word">
                {title}
                {itemsCount > 0 && (
                  <span className="text-muted-foreground ml-2 font-normal">
                    & {itemsCount} more
                  </span>
                )}
              </h3>
            </Link>
          ) : (
            <h3 className="min-w-0 flex-1 text-[16px] font-semibold wrap-break-word text-white md:max-w-100 md:text-[18px]">
              {title}
              {itemsCount > 0 && (
                <span className="text-muted-foreground ml-2 font-normal">
                  & {itemsCount} more
                </span>
              )}
            </h3>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-2 flex shrink-0 md:mt-0">
          <Link
            href={orderDetailsHref}
            onClick={onViewDetails}
            className="border-muted-foreground flex h-10 w-full cursor-pointer items-center justify-center rounded-[6px] border bg-transparent px-6 text-sm font-medium text-white transition-colors hover:bg-white/5 md:w-auto"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}
