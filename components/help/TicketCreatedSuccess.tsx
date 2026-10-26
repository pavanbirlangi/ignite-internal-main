'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ACCOUNT_CARD_CLASS,
  ACCOUNT_PRIMARY_BUTTON_CLASS,
  ACCOUNT_SECONDARY_BUTTON_CLASS,
} from '@/components/library/account-ui'
import { TicketOrderLine } from '@/components/help/ticket/ticket-ui'
import type { TicketCreatedSuccessProps } from '@/types/HelpTypes'

// After a ticket is sent (order ticket or general form): its reference, the order it's about,
// and where the replies show.
export function TicketCreatedSuccess({ order, shortId, ticketsHref, helpHref }: TicketCreatedSuccessProps) {
  return (
    <div className="max-w-180">
      <div className={cn(ACCOUNT_CARD_CLASS, 'flex items-center gap-3 border-[#22C55E]/25 bg-[#22C55E]/8 px-5 py-4')}>
        <CheckCircle2 className="size-6 shrink-0 text-[#4ADE80]" />
        <div>
          <p className="text-base font-bold text-white/95">Ticket sent{shortId ? ` · #${shortId}` : ''}</p>
          <p className="text-sm text-white/65">We&apos;ll email you when we reply. Keep an eye on your inbox and spam folder.</p>
        </div>
      </div>

      {order ? (
        <div className="mt-5">
          <TicketOrderLine order={order} />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {ticketsHref ? (
          <Link href={ticketsHref} className={ACCOUNT_PRIMARY_BUTTON_CLASS}>
            View my tickets
          </Link>
        ) : null}
        <Link href={helpHref} className={ACCOUNT_SECONDARY_BUTTON_CLASS}>
          Back to Help Centre
        </Link>
      </div>
    </div>
  )
}
