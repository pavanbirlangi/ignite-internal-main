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
// of Stripe's `redirect: 'if_required'` option (some wallets/bank redirects).
// Card payments never land here -- CheckoutForm.tsx handles those inline.
export function CheckoutCompleteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clearCart = useCartStore((state) => state.clearCart)
  const [status, setStatus] = React.useState<'checking' | 'error'>('checking')
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

        const { paymentIntent } = await stripe.retrievePaymentIntent(
          paymentIntentClientSecret,
        )

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
          <p className="text-muted-foreground text-base">
            Finishing up your order...
          </p>
        ) : (
          <>
            <p className="text-red text-base font-semibold">{errorMessage}</p>
            <button
              onClick={() => router.push('/cart')}
              className="text-primary text-sm font-semibold underline"
            >
              Back to cart
            </button>
          </>
        )}
      </div>
    </div>
  )
}
