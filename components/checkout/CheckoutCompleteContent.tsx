'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'
import { Check, CircleAlert, Smartphone } from 'lucide-react'
import { CartNavbar } from '@/components/cart/CartNavbar'
import { Spinner } from '@/components/ui/spinner'
import { ACCOUNT_PRIMARY_BUTTON_CLASS, ACCOUNT_SECONDARY_BUTTON_CLASS } from '@/components/library/account-ui'
import { cn } from '@/lib/utils'
import { CheckoutOutOfStockError, checkoutService } from '@/lib/services/checkout.service'
import { useCartStore } from '@/store/useCartStore'
import { extractApiErrorMessage } from '@/lib/utils/api-error'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
)

// Only reached by payment methods that redirect away from the page regardless
// of Stripe's `redirect: 'if_required'` option (some wallets/bank redirects),
// or that are confirmed later (MB WAY: the customer approves it in their
// bank's app, so the payment stays "processing" for a while -- this page
// waits for it). Card payments never land here -- CheckoutForm.tsx handles
// those inline. Stripe's webhook may place the order first; completing the
// cart again then just returns that order.
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 10 * 60 * 1000
export function CheckoutCompleteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clearCart = useCartStore((state) => state.clearCart)
  const [status, setStatus] = React.useState<'checking' | 'waiting' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    const cartId = searchParams.get('cart_id')
    const paymentIntentClientSecret = searchParams.get(
      'payment_intent_client_secret',
    )

    if (!cartId || !paymentIntentClientSecret) {
      setStatus('error')
      setErrorMessage('Missing checkout details. Please try again from your cart.')
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const stripe = await stripePromise
        if (!stripe) throw new Error('Payment could not be initialized.')

        let { paymentIntent } = await stripe.retrievePaymentIntent(
          paymentIntentClientSecret,
        )

        // Still being confirmed (e.g. waiting for approval in a banking app): check again until
        // it settles, for up to 10 minutes.
        const startedAt = Date.now()
        while (
          paymentIntent?.status === 'processing' &&
          Date.now() - startedAt < POLL_TIMEOUT_MS &&
          !cancelled
        ) {
          setStatus('waiting')
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
          ;({ paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentClientSecret))
        }
        if (cancelled) return
        if (paymentIntent?.status === 'processing') {
          setStatus('error')
          setErrorMessage(
            "Your payment is still being confirmed. We'll email you as soon as your order is placed.",
          )
          return
        }
        setStatus('checking')

        if (
          !paymentIntent ||
          (paymentIntent.status !== 'requires_capture' &&
            paymentIntent.status !== 'succeeded')
        ) {
          if (!cancelled) {
            setStatus('error')
            setErrorMessage(
              'Payment was not completed. Please try again from your cart.',
            )
          }
          return
        }

        const result = await checkoutService.completeCart(cartId)
        if (!cancelled) {
          // Navigate before clearing the cart -- same ordering fix as
          // CheckoutForm.tsx, avoids racing against any still-mounted
          // component that redirects on an empty cart.
          router.replace(`/order/confirmation/${result.orderId}`)
          clearCart()
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('error')
          setErrorMessage(
            error instanceof CheckoutOutOfStockError
              ? error.message
              : extractApiErrorMessage(
                  error,
                  "We couldn't finish processing this order.",
                ),
          )
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, router, clearCart])

  return (
    <div className="bg-background min-h-screen font-sans">
      <CartNavbar currentStep={2} />
      <main className="px-4 pt-14 pb-24 md:pt-18">
        <div className="bg-card border-border mx-auto max-w-120 rounded-2xl border px-6 py-9 text-center sm:px-8">
          {status === 'error' ? (
            <>
              <span className="mx-auto mb-5 grid size-16 place-items-center rounded-[18px] bg-[#F04452]/14 text-[#FF6B76]">
                <CircleAlert className="size-7" />
              </span>
              <h1 data-display className="text-2xl leading-[30px] font-bold text-white/95">
                We couldn&apos;t finish your order
              </h1>
              <p className="mt-2 text-[15px] leading-6! text-white/65">{errorMessage}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                <button type="button" onClick={() => router.push('/cart')} className={ACCOUNT_PRIMARY_BUTTON_CLASS}>
                  Back to cart
                </button>
                <Link href="/help" className={ACCOUNT_SECONDARY_BUTTON_CLASS}>
                  Contact support
                </Link>
              </div>
            </>
          ) : (
            <>
              {status === 'waiting' ? (
                <span className="mx-auto mb-5 grid size-16 place-items-center rounded-[18px] bg-[#F5A524]/14 text-[#F5A524]">
                  <Smartphone className="size-7" />
                </span>
              ) : (
                <div className="mb-5 flex justify-center">
                  <Spinner className="size-11" />
                </div>
              )}
              <h1 data-display className="text-2xl leading-[30px] font-bold text-white/95">
                {status === 'waiting' ? 'Approve the payment in your bank app' : 'Finishing up your order'}
              </h1>
              <p className="mt-2 text-[15px] leading-6! text-white/65">
                {status === 'waiting'
                  ? 'If your bank asked you to approve the payment in its app, please do that now. Keep this page open; your order is placed as soon as the payment is confirmed.'
                  : 'This takes a few seconds. Please keep this page open.'}
              </p>
              <ol className="mt-7 flex flex-col gap-3 text-left text-sm">
                {(status === 'waiting'
                  ? [
                      ['now', 'Waiting for your bank'],
                      ['next', 'Placing your order'],
                      ['next', 'Key ready in your library'],
                    ]
                  : [
                      ['done', 'Payment received'],
                      ['now', 'Placing your order'],
                      ['next', 'Key ready in your library'],
                    ]
                ).map(([step, label]) => (
                  <li key={label} className={cn('flex items-center gap-3', step === 'next' ? 'text-white/45' : 'text-white/95')}>
                    <span
                      className={cn(
                        'grid size-6 shrink-0 place-items-center rounded-full',
                        step === 'done' && 'bg-[#22C55E]/16 text-[#4ADE80]',
                        step === 'next' && 'border-border border-[1.5px]',
                      )}
                    >
                      {step === 'done' && <Check className="size-3.5" strokeWidth={3} />}
                      {step === 'now' && <Spinner className="size-4" />}
                    </span>
                    {label}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
