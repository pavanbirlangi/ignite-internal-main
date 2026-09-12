'use client'

import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'
import type { TicketCreatedSuccessProps } from '@/types/HelpTypes'

export function TicketCreatedSuccess({
  order,
  ticketId,
  shortId,
  onViewDetails,
}: TicketCreatedSuccessProps) {
  return (
    <div className="mx-auto w-full max-w-[780px]">
      <div className="border-border bg-secondary/40 rounded-[20px] border p-6 md:p-10">
        <h1 className="mb-2 text-xl font-semibold text-white md:text-[28px]">
          Ticket Created for Order Below
        </h1>
        <p className="text-muted-foreground font-medium mb-6 max-w-2xl text-sm">
          You can check your mail or open tickets for further resolution &amp;
          follow-ups. Please keep checking your email for future updates while
          our team gets back to you.
        </p>

        {/* Ticket reference badge */}
        {shortId && (
          <div className="mb-8 flex items-center gap-3 rounded-[12px] border border-green-500/20 bg-green-500/10 px-5 py-3.5">
            <CheckCircle2 className="size-5 shrink-0 text-green-400" />
            <div>
              <p className="text-xs font-medium text-green-300/80">
                Your ticket reference
              </p>
              <p className="text-base font-bold tracking-widest text-green-300">
                #{shortId}
              </p>
            </div>
          </div>
        )}

        {/* Order Details Card */}
        <div className="bg-secondary/30 border-border/50 flex flex-col items-start justify-between gap-4 rounded-[12px] border py-3 px-5 sm:flex-row sm:items-center">
          <div className="flex w-full items-start gap-4 sm:w-auto">
            {order.image ? (
              <div className="relative h-[79px] w-[62px] shrink-0 overflow-hidden rounded-md">
                <Image
                  src={order.image}
                  alt={order.id}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="bg-secondary h-[79px] w-[62px] shrink-0 rounded-md" />
            )}
            <span className="truncate text-[16px] font-semibold text-white md:text-[18px]">
              {order.id}
            </span>
          </div>

          <button
            onClick={onViewDetails}
            className="border-muted-foreground/50 w-full cursor-pointer rounded-[6px] border bg-transparent px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/5 sm:w-auto"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}
