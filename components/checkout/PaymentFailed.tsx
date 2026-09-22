'use client'

import Link from 'next/link'
import { AlertTriangle, RefreshCw, ShieldAlert, XCircle } from 'lucide-react'

export type PaymentFailureVariant =
  | 'declined' // card refused -- retrying with another card genuinely may work
  | 'blocked' // risk gate rejected it -- retrying the same way will not help
  | 'incomplete' // customer came back from a redirect without paying
  | 'generic' // something broke after payment was attempted

interface PaymentFailedProps {
  variant: PaymentFailureVariant
  /** The specific reason from Stripe or the backend, shown verbatim. */
  message?: string | null
  onRetry?: () => void
  onBackToCart: () => void
  className?: string
}

const COPY: Record<
  PaymentFailureVariant,
  {
    title: string
    body: string
    /** Whether we can honestly promise no money moved. */
    reassurance: string
    retryLabel?: string
  }
> = {
  declined: {
    title: 'Payment declined',
    body: 'Your bank turned down this payment. This is usually a card limit, an expired card, or a block on online purchases.',
    reassurance: "You haven't been charged. Try another card, or check with your bank.",
    retryLabel: 'Try again',
  },
  blocked: {
    title: "We couldn't complete this order",
    body: 'This order was stopped during our automated checks. Our support team can look into it and help you complete the purchase.',
    // Deliberately no "try again" -- the same attempt will be stopped again,
    // and repeatedly retrying is a worse experience than talking to support.
    reassurance: "You haven't been charged.",
  },
  incomplete: {
    title: 'Payment not completed',
    body: 'You came back before the payment finished, or it was cancelled along the way.',
    reassurance: "You haven't been charged. Your cart is still saved.",
    retryLabel: 'Back to checkout',
  },
  generic: {
    title: 'Something went wrong',
    body: "We hit a problem finishing your order. If your payment did go through, don't pay again -- contact support with your email address and we'll sort it out.",
    // Deliberately NOT "you haven't been charged": this fires after the
    // payment was attempted, so the charge may well have succeeded and the
    // failure happened afterwards. Promising otherwise could be false.
    reassurance: 'Please check your email for a confirmation before retrying.',
    retryLabel: 'Try again',
  },
}

const ICONS: Record<PaymentFailureVariant, typeof XCircle> = {
  declined: XCircle,
  blocked: ShieldAlert,
  incomplete: RefreshCw,
  generic: AlertTriangle,
}

export function PaymentFailed({
  variant,
  message,
  onRetry,
  onBackToCart,
  className = '',
}: PaymentFailedProps) {
  const copy = COPY[variant]
  const Icon = ICONS[variant]

  return (
    <div
      role="alert"
      className={`border-red/30 bg-red/5 w-full rounded-xl border p-5 ${className}`}
    >
      <div className="flex gap-3">
        <span className="bg-red/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
          <Icon className="text-red h-4.5 w-4.5" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h3 className="text-base font-semibold text-white">{copy.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {copy.body}
          </p>

          {/* The verbatim reason from Stripe/the backend, when there is one --
              kept visually distinct from our own copy so it's clear which is
              which (e.g. "Your card has insufficient funds."). */}
          {message && (
            <p className="border-border bg-background/40 text-muted-foreground rounded-lg border px-3 py-2 text-xs leading-relaxed">
              {message}
            </p>
          )}

          <p className="text-muted-foreground text-xs font-medium">
            {copy.reassurance}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {onRetry && copy.retryLabel && (
              <button
                type="button"
                onClick={onRetry}
                className="bg-primary hover:bg-primary/90 cursor-pointer rounded-[6px] px-4 py-2 text-sm font-semibold text-white transition-colors"
              >
                {copy.retryLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onBackToCart}
              className="border-border cursor-pointer rounded-[6px] border bg-transparent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/5"
            >
              Back to cart
            </button>
            <Link
              href="/help/create-ticket"
              className="text-muted-foreground flex cursor-pointer items-center rounded-[6px] px-4 py-2 text-sm font-semibold transition-colors hover:text-white"
            >
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
