'use client'

import { CheckCircle2 } from 'lucide-react'

interface GlobalTicketCreatedSuccessProps {
  orderId?: string
  shortId?: string
  onClose: () => void
}

export function GlobalTicketCreatedSuccess({
  orderId,
  shortId,
  onClose,
}: GlobalTicketCreatedSuccessProps) {
  return (
    <div className="mx-auto w-full max-w-[780px]">
      <div className="border-border bg-secondary/40 rounded-[20px] border p-6 md:p-10">
        <h1 className="mb-2 text-xl font-semibold text-white md:text-[28px]">
          Ticket Created Successfully
        </h1>
        <p className="text-muted-foreground font-medium mb-6 max-w-2xl text-sm">
          You can check your mail for further resolution &amp; follow-ups. Please
          keep checking your email for future updates while our team gets back to
          you.
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

        {/* Order ID Reference (if provided) */}
        {orderId && (
          <div className="bg-secondary/30 border-border/50 mb-8 flex flex-col items-start justify-between gap-4 rounded-[12px] border py-4 px-5 sm:flex-row sm:items-center">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-medium">
                Related Order ID
              </span>
              <span className="text-[16px] font-semibold text-white md:text-[18px]">
                {orderId}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="bg-primary hover:bg-primary/90 w-full cursor-pointer rounded-[6px] px-8 py-3 text-center text-sm font-semibold text-white transition-colors sm:w-auto"
        >
          Close
        </button>
      </div>
    </div>
  )
}
