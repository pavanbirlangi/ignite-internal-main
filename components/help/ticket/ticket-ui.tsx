'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Paperclip, X } from 'lucide-react'
import { cn, getProxyImageUrl } from '@/lib/utils'
import { ACCOUNT_CARD_CLASS, StatusPill } from '@/components/library/account-ui'
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '@/lib/orders/order-status'
import {
  MAX_TICKET_ATTACHMENTS,
  MAX_TICKET_ATTACHMENT_SIZE_BYTES,
  mergeAttachments,
} from '@/lib/help/ticket-form'
import type { OrderItem } from '@/types/HelpTypes'

// Shared pieces of the ticket forms (order ticket and general ticket).

export const TICKET_LABEL_CLASS = 'mb-2 block text-sm font-bold text-white/95'

export const TICKET_TEXTAREA_CLASS =
  'bg-background border-border w-full resize-none rounded-lg border px-3 py-3 text-sm text-white/95 transition-colors outline-none placeholder:text-white/45 hover:border-white/20 focus:border-primary/70 disabled:opacity-60'

export function ticketChipClass(active: boolean) {
  return cn(
    'h-9 cursor-pointer rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60',
    active
      ? 'border-primary/55 bg-primary/16 text-white'
      : 'bg-card border-border text-white/75 hover:border-white/20 hover:text-white',
  )
}

// An order as one line: cover, product, number, date, total and status.
export function TicketOrderLine({ order, action }: { order: OrderItem; action?: React.ReactNode }) {
  return (
    <div className={cn(ACCOUNT_CARD_CLASS, 'flex items-center gap-3 p-3')}>
      <div className="bg-secondary relative h-[52px] w-[39px] shrink-0 overflow-hidden rounded-md">
        {order.image ? <Image src={getProxyImageUrl(order.image)} alt="" fill sizes="39px" className="object-cover" /> : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="line-clamp-1 text-sm font-medium text-white/95">{order.products}</span>
        <span className="text-xs text-white/55">
          Order #{order.id} · {order.purchaseDate}
          {order.total ? ` · ${order.total}` : ''}
        </span>
      </div>
      {order.status ? (
        <StatusPill tone={ORDER_STATUS_TONE[order.status]} className="max-sm:hidden">
          {ORDER_STATUS_LABEL[order.status]}
        </StatusPill>
      ) : null}
      {action}
    </div>
  )
}

// Up to 5 files of 2 MB; files over the limit are named instead of silently dropped.
export function TicketAttachments({
  files,
  onChange,
  disabled,
}: {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [tooLarge, setTooLarge] = useState<string[]>([])

  const add = (list: FileList | null) => {
    const picked = Array.from(list ?? [])
    setTooLarge(picked.filter((f) => f.size > MAX_TICKET_ATTACHMENT_SIZE_BYTES).map((f) => f.name))
    onChange(mergeAttachments(files, picked.filter((f) => f.size <= MAX_TICKET_ATTACHMENT_SIZE_BYTES)))
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <span className={TICKET_LABEL_CLASS}>
        Screenshots or files <span className="font-normal text-white/50">(optional)</span>
      </span>
      <button
        type="button"
        disabled={disabled || files.length >= MAX_TICKET_ATTACHMENTS}
        onClick={() => inputRef.current?.click()}
        className="bg-background border-border flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-white/65 transition-colors hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Paperclip className="size-4" />
        Add files (up to {MAX_TICKET_ATTACHMENTS}, 2 MB each)
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={(e) => add(e.target.files)}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
        disabled={disabled}
      />
      {tooLarge.length > 0 ? (
        <p className="mt-2 text-xs text-[#F5A524]">Over 2 MB, not added: {tooLarge.join(', ')}</p>
      ) : null}
      {files.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {files.map((file, i) => (
            <span
              key={`${file.name}-${i}`}
              className="bg-secondary border-border flex items-center gap-1.5 rounded-md border py-1 pr-1 pl-2.5 text-xs text-white/90"
            >
              <span className="max-w-40 truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                className="flex size-5 cursor-pointer items-center justify-center rounded hover:bg-white/10 disabled:cursor-not-allowed"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
