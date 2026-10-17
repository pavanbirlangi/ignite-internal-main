'use client'

import { cn, getProxyImageUrl } from '@/lib/utils'
import {
  ACCOUNT_CARD_CLASS,
  ACCOUNT_SECONDARY_BUTTON_CLASS,
  MetaItem,
  StatusPill,
  type StatusTone,
} from '@/components/library/account-ui'
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

// One status per order for the badge: refunds first, then delivery, then payment.
export function getOrderDisplayStatus(order: {
  financialStatus?: string
  fulfillmentStatus?: string
}): OrderStatus {
  if (order.financialStatus === 'REFUNDED') return 'REFUNDED'
  if (order.financialStatus === 'PARTIALLY_REFUNDED') return 'PARTIALLY_REFUNDED'
  if (order.financialStatus === 'VOIDED') return 'VOIDED'
  if (order.fulfillmentStatus === 'FULFILLED') return 'FULFILLED'
  if (order.financialStatus === 'PAID') return 'PAID'
  if (order.financialStatus === 'PENDING' || order.financialStatus === 'AUTHORIZED')
    return 'PENDING'
  return order.financialStatus as OrderStatus
}

export function orderStatusTone(status: OrderStatus): StatusTone {
  switch (status) {
    case 'FULFILLED':
    case 'SUCCESSFUL':
      return 'success'
    case 'PAID':
    case 'AUTHORIZED':
      return 'info'
    case 'CANCELLED':
    case 'VOIDED':
      return 'danger'
    case 'PENDING':
    case 'UNFULFILLED':
    case 'PARTIALLY_FULFILLED':
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
    case 'REFUND SUCCESSFUL':
    case 'REFUND INITIATED':
      return 'warning'
    default:
      return 'neutral'
  }
}

// PARTIALLY_REFUNDED -> "Partially refunded"
export function orderStatusLabel(status: OrderStatus) {
  const words = status.replace(/_/g, ' ').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
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
        <StatusPill tone={orderStatusTone(status)}>{orderStatusLabel(status)}</StatusPill>
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
