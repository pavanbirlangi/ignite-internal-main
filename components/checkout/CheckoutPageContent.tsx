'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CartNavbar } from '@/components/cart/CartNavbar'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary'
import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
import { checkoutService } from '@/lib/services/checkout.service'
import { extractApiErrorMessage } from '@/lib/utils/api-error'

export function CheckoutPageContent() {
  const { locale } = useParams<{ locale: string }>()
  const router = useRouter()
  const { cart, cartId, isLoading, initCart } = useCartStore()
  const user = useUserStore((state) => state.user)

  const [clientSecret, setClientSecret] = React.useState<string | null>(null)
  const [sessionError, setSessionError] = React.useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = React.useState(true)
  // Flipped the instant an order finishes, before the cart is cleared or any
  // navigation happens. `router.push` doesn't block -- clearing the cart
  // right after a successful payment triggers a synchronous re-render of
  // this still-mounted component, and without this guard its own "cart is
  // empty" effect below wins the race and overwrites the trip to the order
  // confirmation page with a redirect back to /cart instead.
  const hasCompletedOrderRef = React.useRef(false)

  React.useEffect(() => {
    initCart()
  }, [initCart])

  React.useEffect(() => {
    // Cart is still resolving (or genuinely has no items) -- an empty cart
    // reaching checkout only happens via direct navigation/back-button, so
    // send it back to the cart page rather than showing a $0 payment form.
    if (isLoading) return
    if (hasCompletedOrderRef.current) return
    if (!cartId || !cart || cart.items.length === 0) {
      router.replace('/cart')
      return
    }

    let cancelled = false
    setSessionLoading(true)
    setSessionError(null)

    checkoutService
      .getOrCreateStripeSession(cartId)
      .then((session) => {
        if (!cancelled) setClientSecret(session.clientSecret)
      })
      .catch((error) => {
        if (!cancelled) {
          setSessionError(
            extractApiErrorMessage(
              error,
              'Could not start checkout. Please try again.',
            ),
          )
        }
      })
      .finally(() => {
        if (!cancelled) setSessionLoading(false)
      })

    return () => {
      cancelled = true
    }
    // Only re-run when the cart identity actually changes, not on every
    // cart mutation (quantity changes etc. shouldn't re-create the session).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId, isLoading])

  if (isLoading || sessionLoading || !cart) {
    return (
      <div className="bg-background min-h-screen font-sans">
        <CartNavbar currentStep={2} />
        <div className="flex min-h-100 items-center justify-center px-6 py-16">
          <p className="text-muted-foreground text-base">
            Preparing checkout...
          </p>
        </div>
      </div>
    )
  }

  if (sessionError || !clientSecret) {
    return (
      <div className="bg-background min-h-screen font-sans">
        <CartNavbar currentStep={2} />
        <div className="flex min-h-100 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <p className="text-red text-base font-semibold">
            {sessionError ?? 'Could not start checkout.'}
          </p>
          <button
            onClick={() => router.push('/cart')}
            className="text-primary text-sm font-semibold underline"
          >
            Back to cart
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen font-sans">
      <CartNavbar currentStep={2} />

      <section className="mx-auto grid w-full max-w-310 grid-cols-1 gap-10 px-4 py-10 lg:grid-cols-[1fr_380px] lg:py-16">
        <CheckoutForm
          cartId={cartId!}
          clientSecret={clientSecret}
          email={user?.email ?? ''}
          locale={locale}
          onOrderCompleted={() => {
            hasCompletedOrderRef.current = true
          }}
        />
        <CheckoutSummary cart={cart} />
      </section>
    </div>
  )
}
