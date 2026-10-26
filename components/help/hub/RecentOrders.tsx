'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn, getProxyImageUrl, localizedHref } from '@/lib/utils'
import {
  ACCOUNT_CARD_CLASS,
  ACCOUNT_SECONDARY_BUTTON_CLASS,
  ACCOUNT_SECTION_LABEL_CLASS,
  StatusPill,
} from '@/components/library/account-ui'
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '@/lib/orders/order-status'
import { orderService } from '@/lib/services/order.service'
import { ticketHref } from '@/lib/help/help-links'
import { toTicketOrder } from '@/lib/help/ticket-order'
import { useUserStore } from '@/store/useUserStore'
import type { OrderItem } from '@/types/HelpTypes'

const SHOWN = 3

// Signed-in customers' latest orders, each one tap from a ticket that already knows the order.
// Nothing shows for guests or customers without orders.
export default function RecentOrders({ locale }: { locale: string }) {
  const user = useUserStore((s) => s.user)
  const [orders, setOrders] = useState<OrderItem[] | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    orderService
      .getOrders({ first: SHOWN })
      .then(({ orders: raw }) => !cancelled && setOrders(raw.map(toTicketOrder)))
      .catch(() => !cancelled && setOrders([]))
    return () => {
      cancelled = true
    }
  }, [user])

  if (!user || (orders && orders.length === 0)) return null

  return (
    <section aria-labelledby="help-recent-orders" className="mt-10">
      <h2 id="help-recent-orders" data-display className={cn(ACCOUNT_SECTION_LABEL_CLASS, 'mb-3')}>
        Get help with a recent order
      </h2>
      <div className="grid gap-3 md:grid-cols-3">
        {(orders ?? Array.from({ length: SHOWN }, () => null)).map((order, i) =>
          order ? (
            <div key={order.id} className={cn(ACCOUNT_CARD_CLASS, 'flex gap-3 p-3.5')}>
              <div className="bg-secondary relative h-[60px] w-[45px] shrink-0 overflow-hidden rounded-md">
                {order.image ? (
                  <Image src={getProxyImageUrl(order.image)} alt="" fill sizes="45px" className="object-cover" />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-xs text-white/55">
                  #{order.id} · {order.purchaseDate}
                </span>
                <span className="mt-0.5 line-clamp-1 text-sm font-medium text-white/95">{order.products}</span>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  {order.status ? (
                    <StatusPill tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</StatusPill>
                  ) : (
                    <span />
                  )}
                  <Link
                    href={localizedHref(locale, ticketHref({ order: order.id }))}
                    className={cn(ACCOUNT_SECONDARY_BUTTON_CLASS, 'h-8 px-3 text-xs')}
                  >
                    Get help
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div key={i} className={cn(ACCOUNT_CARD_CLASS, 'h-[90px] animate-pulse')} />
          ),
        )}
      </div>
      <Link
        href={localizedHref(locale, ticketHref())}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#5B93F0] hover:underline"
      >
        Another order
        <ChevronRight className="size-3.5" />
      </Link>
    </section>
  )
}
