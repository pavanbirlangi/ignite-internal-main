import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowRight, Info, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { useCartStore } from '@/store/useCartStore'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface OrderSummaryProps {
  subtotal: number
  savings: number
  total: number
  itemCount: number
  currency: string
  /** Returns false when checkout can't open (e.g. the sign-in modal opened instead). */
  onCheckout: () => boolean | void
  onNavigate: () => void
  /** Shown above the button, which is then disabled (e.g. a sold-out item is in the cart). */
  blockedReason?: string
}

const LEGAL_LINK_CLASS =
  'text-white/95 underline decoration-white/30 underline-offset-2 transition-colors hover:decoration-white'

export function OrderSummary({
  subtotal,
  savings,
  total,
  itemCount,
  currency,
  onCheckout,
  onNavigate,
  blockedReason,
}: OrderSummaryProps) {
  const cartCmsData = useCartStore((state) => state.cartCmsData)
  const [isOpening, startOpening] = useTransition()
  const [tipOpen, setTipOpen] = useState(false)

  const handleCheckout = () => {
    if (onCheckout() === false) return
    // Spins until the checkout page has rendered.
    startOpening(onNavigate)
  }

  return (
    <div className="static w-full lg:sticky lg:top-28">
      <h2 data-display className="mb-4 text-xl leading-6 font-bold text-white/95 md:text-2xl md:leading-[30px]">
        Order Summary
      </h2>

      <div className="bg-card border-border rounded-2xl border p-5 sm:p-5.5">
        <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
          <span className="text-white/65">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="font-medium whitespace-nowrap text-white/95">{formatCurrency(subtotal + savings, currency)}</span>
        </div>
        {savings > 0 && (
          <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
            <span className="text-white/65">You save</span>
            <span className="font-medium whitespace-nowrap text-[#4ADE80]">- {formatCurrency(savings, currency)}</span>
          </div>
        )}

        {/* The service fee and tax are added at checkout, so the total here is the products total
            and flagged as not final. */}
        <div className="border-border mt-2 flex items-start justify-between gap-3 border-t pt-3.5">
          <span className="text-lg leading-7 font-bold text-white/95">Your cart total</span>
          <div className="flex flex-col items-end gap-1">
            <span className="text-2xl leading-[30px] font-bold whitespace-nowrap text-white/95">
              {formatCurrency(total, currency)}
            </span>
            <span className="relative">
              <button
                type="button"
                onClick={() => setTipOpen((open) => !open)}
                onBlur={() => setTipOpen(false)}
                onMouseEnter={() => setTipOpen(true)}
                onMouseLeave={() => setTipOpen(false)}
                aria-describedby="price-not-final-tip"
                aria-expanded={tipOpen}
                className="inline-flex cursor-help items-center gap-1.5 rounded text-xs font-medium tracking-[0.6px] text-white/65 uppercase outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
              >
                Price not final
                <Info className="size-3.5" />
              </button>
              <span
                id="price-not-final-tip"
                role="tooltip"
                className={cn(
                  'bg-secondary border-border pointer-events-none absolute right-0 bottom-[calc(100%+10px)] z-20 w-62 rounded-[10px] border px-3 py-2.5 text-left text-[13px] leading-[18px] text-white/95 shadow-[0_12px_30px_rgb(0_0_0/0.5)] transition-all duration-150',
                  tipOpen ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
                )}
              >
                A small service fee and any taxes are added at checkout.
              </span>
            </span>
          </div>
        </div>

        {blockedReason && (
          <p role="alert" className="mt-5 -mb-2 text-[13px] leading-[18px] font-medium text-[#FF7088]">
            {blockedReason}
          </p>
        )}
        <button
          type="button"
          onClick={handleCheckout}
          disabled={isOpening || Boolean(blockedReason)}
          aria-busy={isOpening || undefined}
          className="group/cta bg-primary relative mt-5 flex h-13 w-full cursor-pointer items-center justify-center overflow-hidden rounded-[10px] text-[15px] font-medium text-white shadow-[0_10px_30px_-8px_var(--primary-glow-60)] transition-all duration-200 outline-none hover:-translate-y-px hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/40 active:translate-y-0 disabled:hover:translate-y-0 disabled:cursor-default disabled:opacity-50 disabled:shadow-none disabled:hover:brightness-100"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/4 -translate-x-full skew-x-[-20deg] bg-white/25 blur-[2px] transition-transform duration-700 ease-out group-hover/cta:translate-x-[700%] motion-reduce:hidden"
          />
          <span className={cn('inline-flex items-center gap-2', isOpening && 'invisible')}>
            Proceed to Checkout
            <ArrowRight className="size-4.5 transition-transform duration-300 ease-out group-hover/cta:translate-x-1" />
          </span>
          {isOpening && (
            <span className="absolute inset-0 grid place-items-center">
              <Spinner className="size-5.5" />
            </span>
          )}
        </button>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs! leading-4! text-white/65">
          <Lock className="size-3.5" />
          Secure payment, keys delivered instantly
        </p>
      </div>

      {cartCmsData?.acknowledgement_text ? (
        <div
          className="mt-3.5 px-1 text-xs leading-[18px] text-white/65 [&_a]:text-white/95 [&_a]:underline [&_a]:decoration-white/30 [&_a]:underline-offset-2 [&_a:hover]:decoration-white [&_p]:text-xs! [&_p]:leading-[18px]!"
          dangerouslySetInnerHTML={{ __html: cartCmsData.acknowledgement_text }}
        />
      ) : (
        <p className="mt-3.5 px-1 text-xs! leading-[18px]! text-white/65">
          By proceeding through checkout, I acknowledge I have read and accepted the{' '}
          <Link href="/legal/terms-and-conditions" className={LEGAL_LINK_CLASS}>
            Terms and Conditions
          </Link>{' '}
          including the{' '}
          <Link href="/legal/privacy-policy" className={LEGAL_LINK_CLASS}>
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/legal/refund-policy" className={LEGAL_LINK_CLASS}>
            Refund Policy
          </Link>
          .
        </p>
      )}
    </div>
  )
}
