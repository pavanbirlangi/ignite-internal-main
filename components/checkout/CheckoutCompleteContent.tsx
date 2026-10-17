'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { CartNavbar } from '@/components/cart/CartNavbar'
import { checkoutService } from '@/lib/services/checkout.service'
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
            extractApiErrorMessage(
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
      <div className="flex min-h-100 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        {status === 'checking' ? (
          <p className="text-white/65 text-base">
            Finishing up your order...
          </p>
        ) : status === 'waiting' ? (
          <>
            <p className="text-base font-bold text-white/95">
              Waiting for your payment to be confirmed...
            </p>
            <p className="text-white/65 max-w-md text-sm">
              If your bank asked you to approve the payment in its app, please do that now. Keep
              this page open; your order is placed as soon as the payment is confirmed.
            </p>
          </>
        ) : (
          <>
            <p className="text-red text-base font-bold">{errorMessage}</p>
            <button
              onClick={() => router.push('/cart')}
              className="text-primary text-sm font-bold underline"
            >
              Back to cart
            </button>
          </>
        )}
      </div>
    </div>
  )
}
