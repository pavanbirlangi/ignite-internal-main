'use client'

import * as React from 'react'
import Cookies from 'js-cookie'
import { useParams, useRouter } from 'next/navigation'
import { CartNavbar } from '@/components/cart/CartNavbar'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { CheckoutSummary, type CheckoutCharge } from '@/components/checkout/CheckoutSummary'
import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
import { checkoutService, type PaymentMethodOption } from '@/lib/services/checkout.service'
import { IP_COUNTRY_COOKIE } from '@/lib/utils/display-currency'
import { extractApiErrorMessage } from '@/lib/utils/api-error'

export function CheckoutPageContent() {
  const { locale } = useParams<{ locale: string }>()
  const router = useRouter()
  const { cart, cartId, isLoading, initCart, applyServiceFee } = useCartStore()
  const user = useUserStore((state) => state.user)

  const [checkoutEmail, setCheckoutEmail] = React.useState<string | null>(null)
  const [clientSecret, setClientSecret] = React.useState<string | null>(null)
  const [sessionError, setSessionError] = React.useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = React.useState(true)
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethodOption[]>([])
  // The local method the customer picked (e.g. "bancontact"), or null for the usual USD methods
  // (card, wallets, Link, Alipay). Only visitors whose country has local methods ever see the choice.
  const [selectedMethodId, setSelectedMethodId] = React.useState<string | null>(null)
  const [switchingMethod, setSwitchingMethod] = React.useState(false)
  const [methodError, setMethodError] = React.useState<string | null>(null)
  // Flipped the instant an order finishes, before the cart is cleared or any
  // navigation happens. `router.push` doesn't block -- clearing the cart
  // right after a successful payment triggers a synchronous re-render of
  // this still-mounted component, and without this guard its own "cart is
  // empty" effect below wins the race and overwrites the trip to the order
  // confirmation page with a redirect back to /cart instead.
  const hasCompletedOrderRef = React.useRef(false)

  // Tracks whether THIS mount's own cart fetch has resolved at least once -- `cart`/`cartId`/
  // `isLoading` are global store state that can still hold a stale, truthy value left over from
  // whatever page the customer was just on (e.g. right after logging in, which transfers the guest
  // cart to the new customer). Without this, the effect below could fire off a premature session
  // request against that stale cart, then fire again once `initCart` lands with the real one --
  // racing two payment-session creations for the same brand-new cart/customer. For a customer's
  // very first session ever, that races the backend's one-time Stripe account-holder creation too,
  // which is what actually 500s. A reload fixes it only because the store resets to a genuinely
  // empty initial state, so the stale/duplicate fire can't happen.
  const [cartReady, setCartReady] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    initCart().finally(() => {
      if (!cancelled) setCartReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [initCart])

  React.useEffect(() => {
    // Cart is still resolving (or genuinely has no items) -- an empty cart
    // reaching checkout only happens via direct navigation/back-button, so
    // send it back to the cart page rather than showing a $0 payment form.
    if (!cartReady || isLoading) return
    if (hasCompletedOrderRef.current) return
    if (!cartId || !cart || cart.items.length === 0) {
      router.replace('/cart')
      return
    }

    let cancelled = false
    setSessionLoading(true)
    setSessionError(null)

    // The fee must be current before a payment session is created, not just before /complete --
    // otherwise the first session Stripe ever sees already carries a stale amount (item 14).
    applyServiceFee()
      .catch((error) => {
        console.error('Failed to apply service fee before checkout', error)
      })
      .then(() => checkoutService.getOrCreateStripeSession(cartId))
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
  }, [cartReady, cartId, isLoading])

  // What checkout offers and what each method charges. Refetched whenever the cart's real total
  // changes (service fee, coupon), so the "You will pay" amount always matches the charge.
  const chargeTotal = cart?.chargeTotal
  React.useEffect(() => {
    if (!cartReady || !cartId) return
    let cancelled = false
    const ipCountry = Cookies.get(IP_COUNTRY_COOKIE) || Cookies.get('user_country')
    checkoutService
      .getPaymentMethods(cartId, ipCountry)
      .then((methods) => {
        if (!cancelled) setPaymentMethods(methods)
      })
      .catch((error) => {
        console.error('Failed to load payment methods', error)
      })
    return () => {
      cancelled = true
    }
  }, [cartReady, cartId, chargeTotal])

  // Forces a fresh Stripe session (a real re-POST, not the cached one) whenever the cart's total
  // changes after a session already exists: a stale service fee (item 14's 409) and applying or
  // removing a coupon code both land here, for the same reason -- Elements is keyed on
  // clientSecret (see CheckoutForm.tsx) so this also remounts the payment form with the new total.
  const refreshPaymentSession = React.useCallback(() => {
    if (!cartId) return
    checkoutService
      .getOrCreateStripeSession(cartId, { forceRefresh: true, methodId: selectedMethodId })
      .then((session) => setClientSecret(session.clientSecret))
      .catch((error) => {
        console.error('Failed to refresh payment session', error)
      })
  }, [cartId, selectedMethodId])

  // Switching between the usual methods and a local one needs a new payment in the other
  // currency, so a new session (and payment form) for it.
  const selectMethod = React.useCallback(
    (methodId: string | null) => {
      if (!cartId || methodId === selectedMethodId || switchingMethod) return
      setSwitchingMethod(true)
      setMethodError(null)
      checkoutService
        .getOrCreateStripeSession(cartId, { methodId })
        .then((session) => {
          setSelectedMethodId(methodId)
          setClientSecret(session.clientSecret)
        })
        .catch((error) => {
          setMethodError(
            extractApiErrorMessage(error, 'This payment method is not available right now.'),
          )
        })
        .finally(() => setSwitchingMethod(false))
    },
    [cartId, selectedMethodId, switchingMethod],
  )

  // A local method that is no longer offered (e.g. switched off in Stripe) falls back to the usual ones.
  React.useEffect(() => {
    if (!selectedMethodId || !paymentMethods.length) return
    if (!paymentMethods.some((m) => m.id === selectedMethodId && m.kind === 'local')) {
      selectMethod(null)
    }
  }, [paymentMethods, selectedMethodId, selectMethod])

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

  // The payment method decides the charge currency (card -> USD, a local method -> its own); the
  // customer never picks a currency. For a method charging in the cart's own currency the cart's
  // live total is exact; otherwise the backend's converted amount is. Until the methods load, the
  // cart's total is what card charges.
  const localMethods = paymentMethods.filter((m) => m.kind === 'local' && m.available)
  const paymentMethod =
    (selectedMethodId && localMethods.find((m) => m.id === selectedMethodId)) ||
    paymentMethods.find((m) => m.kind === 'global' && m.available) ||
    null
  const charge: CheckoutCharge =
    paymentMethod &&
    paymentMethod.chargeCurrency !== cart.chargeCurrencyCode.toLowerCase() &&
    paymentMethod.chargeAmount !== null
      ? { currency: paymentMethod.chargeCurrency, amount: paymentMethod.chargeAmount }
      : { currency: cart.chargeCurrencyCode, amount: cart.chargeTotal }

  return (
    <div className="bg-background min-h-screen font-sans">
      <CartNavbar currentStep={2} />

      <section className="mx-auto grid w-full max-w-310 grid-cols-1 gap-10 px-4 py-10 lg:grid-cols-[1fr_380px] lg:py-16">
        <CheckoutForm
          cartId={cartId!}
          clientSecret={clientSecret}
          email={checkoutEmail ?? cart.email ?? user?.email ?? ''}
          onEmailChange={setCheckoutEmail}
          locale={locale}
          onOrderCompleted={() => {
            hasCompletedOrderRef.current = true
          }}
          onServiceFeeStale={refreshPaymentSession}
          localMethods={localMethods}
          selectedMethodId={selectedMethodId}
          onSelectMethod={selectMethod}
          switchingMethod={switchingMethod}
          methodError={methodError}
        />
        <CheckoutSummary cart={cart} charge={charge} onCartChanged={refreshPaymentSession} />
      </section>
    </div>
  )
}
