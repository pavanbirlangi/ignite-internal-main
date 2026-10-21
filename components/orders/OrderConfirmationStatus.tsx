import Link from 'next/link'
import { Clock, RotateCcw, X } from 'lucide-react'
import type { ConfirmationState } from '@/lib/orders/order-confirmation'
import { StatusPill, type StatusTone, ACCOUNT_PRIMARY_BUTTON_CLASS } from '@/components/library/account-ui'
import { cn } from '@/lib/utils'

interface OrderConfirmationStatusProps {
  state?: ConfirmationState
  orderNumber?: string | number
  orderDate?: string
  email?: string
}

const content: Record<
  ConfirmationState,
  { title: string; description: (email?: string) => string; tone: StatusTone; pill: string }
> = {
  'success-key-ready': {
    title: 'Order confirmed',
    description: (email) =>
      `Thanks for your order! Your key is ready: view it below.${email ? ` We've also emailed it to ${email}.` : ''}`,
    tone: 'success',
    pill: 'Paid',
  },
  'success-processing': {
    title: 'Order confirmed',
    description: (email) =>
      `Thanks for your order! Your key is being prepared and appears below as soon as it's ready.${email ? ` We'll also email it to ${email}.` : ''}`,
    tone: 'info',
    pill: 'Paid',
  },
  refunded: {
    title: 'Order refunded',
    description: () =>
      'This order was refunded to your original payment method. Depending on your bank, it can take a few business days to appear.',
    tone: 'warning',
    pill: 'Refunded',
  },
  failed: {
    title: 'Order not completed',
    description: () =>
      "Your order could not be completed. If any amount was deducted, it will be refunded according to your payment provider's timelines.",
    tone: 'danger',
    pill: 'Not completed',
  },
}

const iconTone: Record<ConfirmationState, string> = {
  'success-key-ready': 'bg-[#22C55E]/14 text-[#4ADE80] before:border-[#22C55E]/35',
  'success-processing': 'bg-primary/16 text-[#7DB0FF] before:border-primary/35',
  refunded: 'bg-[#F5A524]/12 text-[#F5A524] before:border-[#F5A524]/30',
  failed: 'bg-[#F04452]/14 text-[#FF6B76] before:border-[#F04452]/30',
}

// The top of the confirmation page: an icon that pops in (a drawn tick for a confirmed order),
// the title, a short line and the order's status, number and date.
export default function OrderConfirmationStatus({
  state = 'success-key-ready',
  orderNumber,
  orderDate,
  email,
}: OrderConfirmationStatusProps) {
  const c = content[state]
  const meta = [orderNumber && `Order #${orderNumber}`, orderDate].filter(Boolean).join(' · ')

  return (
    <section className="text-center">
      <div
        className={cn(
          'animate-confirm-pop relative mx-auto mb-5.5 grid size-22 place-items-center rounded-full',
          'before:animate-confirm-ring before:absolute before:-inset-3.5 before:rounded-full before:border-2',
          iconTone[state],
        )}
      >
        {state === 'failed' ? (
          <X className="size-9" strokeWidth={2.6} />
        ) : state === 'refunded' ? (
          <RotateCcw className="size-8" strokeWidth={2.4} />
        ) : state === 'success-processing' ? (
          <Clock className="size-9" strokeWidth={2.4} />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-9.5">
            <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray={1} className="animate-check-draw" />
          </svg>
        )}
      </div>

      <h1 data-display className="text-[28px] leading-[34px] font-bold text-white/95 md:text-[32px] md:leading-[38px]">
        {c.title}
      </h1>
      <p className="mx-auto mt-2 max-w-130 text-[15px] leading-6! text-white/65">{c.description(email)}</p>

      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
        <StatusPill tone={c.tone}>{c.pill}</StatusPill>
        {meta && <span className="text-sm text-white/65">{meta}</span>}
      </div>

      {state === 'failed' && (
        <Link href="/help" className={cn(ACCOUNT_PRIMARY_BUTTON_CLASS, 'mt-6')}>
          Contact support
        </Link>
      )}
    </section>
  )
}
