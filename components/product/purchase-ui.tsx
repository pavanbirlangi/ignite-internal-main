'use client'

import { useState } from 'react'
import { ArrowRight, Info, ShoppingCart } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import type { AddState } from '@/hooks/useProductPurchase'

export function ProductPrice({
  price,
  compareAtPrice,
  discountPercent,
  size = 'lg',
}: {
  price: string
  compareAtPrice?: string | null
  discountPercent?: number | null
  size?: 'lg' | 'sm'
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span
        className={cn(
          'font-bold tracking-[-0.3px] whitespace-nowrap text-white/95',
          size === 'lg' ? 'text-[32px] leading-[38px]' : 'text-xl leading-6',
        )}
      >
        {price}
      </span>
      {compareAtPrice && (
        <span className={cn('whitespace-nowrap text-white/45 line-through', size === 'lg' ? 'text-base' : 'text-sm')}>
          {compareAtPrice}
        </span>
      )}
      {discountPercent ? (
        <span className="bg-deal inline-flex h-5.5 items-center self-center rounded-md px-2 text-xs font-bold text-white">
          -{discountPercent}%
        </span>
      ) : null}
    </div>
  )
}

// Same note and wording as the cart summary: the service fee and taxes are added at checkout.
export function PriceNotFinal({ label, tip }: { label: string; tip: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-describedby="product-price-not-final-tip"
        aria-expanded={open}
        className="inline-flex cursor-help items-center gap-1.5 rounded text-xs font-medium tracking-[0.6px] text-white/65 uppercase outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
      >
        {label}
        <Info className="size-3.5" />
      </button>
      <span
        id="product-price-not-final-tip"
        role="tooltip"
        className={cn(
          'bg-secondary border-border pointer-events-none absolute bottom-[calc(100%+10px)] left-0 z-20 w-62 rounded-[10px] border px-3 py-2.5 text-left text-[13px] leading-[18px] text-white/95 shadow-[0_12px_30px_rgb(0_0_0/0.5)] transition-all duration-150',
          open ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
        )}
      >
        {tip}
      </span>
    </span>
  )
}

export function BuyNowButton({
  label,
  disabled,
  busy,
  onClick,
  className,
  id,
}: {
  label: string
  disabled: boolean
  busy: boolean
  onClick: () => void
  className?: string
  id?: string
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cn(
        'group/cta bg-primary relative flex h-13 w-full cursor-pointer items-center justify-center overflow-hidden rounded-[10px] text-[15px] font-medium text-white shadow-[0_10px_30px_-8px_var(--primary-glow-60)] transition-all duration-200 outline-none hover:-translate-y-px hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/40 active:translate-y-0 disabled:cursor-default disabled:hover:translate-y-0',
        disabled && 'bg-secondary text-white/65 shadow-none hover:brightness-100',
        className,
      )}
    >
      {!disabled && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/4 -translate-x-full skew-x-[-20deg] bg-white/25 blur-[2px] transition-transform duration-700 ease-out group-hover/cta:translate-x-[700%] motion-reduce:hidden"
        />
      )}
      <span className={cn('inline-flex items-center gap-2', busy && 'invisible')}>
        {label}
        {!disabled && (
          <ArrowRight className="size-4.5 transition-transform duration-300 ease-out group-hover/cta:translate-x-1" />
        )}
      </span>
      {busy && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner className="size-5.5" />
        </span>
      )}
    </button>
  )
}

// Spins while adding, then draws a tick (same feedback as the cards and the cart suggestions).
export function AddToCartButton({
  label,
  disabled,
  state,
  onClick,
}: {
  label: string
  disabled: boolean
  state: AddState
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || state !== 'idle'}
      aria-busy={state === 'loading' || undefined}
      className={cn(
        'relative inline-flex h-12 flex-1 cursor-pointer items-center justify-center rounded-[10px] border border-white/10 bg-white/6 text-sm font-medium text-white/95 transition-all duration-200 outline-none hover:-translate-y-px hover:border-white/20 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-default disabled:hover:translate-y-0',
        state === 'done' && 'border-[#22C55E]/40 bg-[#22C55E]/14 text-[#4ADE80] hover:bg-[#22C55E]/14',
        disabled && 'opacity-45',
      )}
    >
      <span className={cn('inline-flex items-center gap-2', state !== 'idle' && 'invisible')}>
        <ShoppingCart className="size-4.5" />
        {label}
      </span>
      {state === 'loading' && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner className="size-4.5" />
        </span>
      )}
      {state === 'done' && (
        <span className="absolute inset-0 grid place-items-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-4.5">
            <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray={1} className="animate-check-draw" />
          </svg>
        </span>
      )}
    </button>
  )
}
