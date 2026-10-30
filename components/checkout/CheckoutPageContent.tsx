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

export function CheckoutPageContent() {
  const { locale } = useParams<{ locale: string }>()
  const router = useRouter()
  const { cart, cartId, isLoading, initCart, applyServiceFee } = useCartStore()
  const user = useUserStore((state) => state.user)

  const [checkoutEmail, setCheckoutEmail] = React.useState<string | null>(null)
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethodOption[]>([])
  // The local method the customer picked (e.g. "bancontact"), or null for the usual USD methods
  // (card, wallets, Link, Alipay). Only visitors whose country has local methods ever see the choice.
  const [pickedMethodId, setPickedMethodId] = React.useState<string | null>(null)
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
  // cart to the new customer). Acting on that stale cart could race two payment-session creations
  // for the same cart/customer, which for a customer's very first session also races the backend's
  // one-time Stripe account-holder creation (a 500).
  const [cartReady, setCartReady] = React.useState(false)
  // The service fee has been brought up to date for this visit (or failed trying).
  const [feeReady, setFeeReady] = React.useState(false)

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
    }
  }, [cartReady, isLoading, cartId, cart, router])

  // The fee must be current before a payment session is created, not just before /complete --
  // otherwise the session Stripe sees carries a stale amount (item 14). Runs in the background:
  // the page and the payment form don't wait for it, only the session does.
  React.useEffect(() => {
    if (!cartReady || !cartId) return
    let cancelled = false
    applyServiceFee()
      .catch((error) => {
        console.error('Failed to apply service fee before checkout', error)
      })
      .finally(() => {
        if (!cancelled) setFeeReady(true)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartReady, cartId])

  // What checkout offers and what each method charges. Refetched whenever the cart's real total
  // changes (service fee, coupon), so the "You will pay" amount always matches the charge.
  // Starts as soon as the cart id is known (not after the cart has loaded): Stripe's form needs the
  // method types from it before it can draw.
  const chargeTotal = cart?.chargeTotal
  React.useEffect(() => {
    if (!cartId) return
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
  }, [cartId, chargeTotal])

  // A local method that is no longer offered (e.g. switched off in Stripe) falls back to the usual ones.
  const selectedMethodId =
    pickedMethodId && paymentMethods.length && !paymentMethods.some((m) => m.id === pickedMethodId && m.kind === 'local')
      ? null
      : pickedMethodId

  // Stripe's form must offer exactly the types the backend pins the payment to
  // (pin-payment-method-types): every global method's types for the usual USD payment, or the
  // chosen local method's own. Null until the methods have loaded.
  const paymentMethodTypes = React.useMemo(() => {
    const available = paymentMethods.filter((m) => m.available)
    if (!available.length) return null
    const chosen = selectedMethodId ? available.filter((m) => m.id === selectedMethodId) : available.filter((m) => m.kind === 'global')
    const types = [...new Set(chosen.flatMap((m) => m.stripeTypes))]
    return types.length ? types : null
  }, [paymentMethods, selectedMethodId])

  // The payment session (Stripe PaymentIntent) for the current total and method. The form no
  // longer waits for it: it's prepared in the background once the fee is current, and "Pay now"
  // uses that one, or waits for it, or makes a new one if the total or method changed since.
  const sessionRef = React.useRef<{ key: string; promise: Promise<string> } | null>(null)
  const staleSessionRef = React.useRef(false)
  const sessionKey = `${cartId}|${chargeTotal}|${selectedMethodId ?? ''}`
  const getClientSecret = React.useCallback((): Promise<string> => {
    if (!cartId) return Promise.reject(new Error('No cart'))
    if (sessionRef.current?.key === sessionKey) return sessionRef.current.promise
    const forceRefresh = staleSessionRef.current
    staleSessionRef.current = false
    const promise = checkoutService
      .getOrCreateStripeSession(cartId, { forceRefresh, methodId: selectedMethodId })
      .then((session) => session.clientSecret)
    const entry = { key: sessionKey, promise }
    sessionRef.current = entry
    // A failed attempt isn't kept: the next one tries again.
    promise.catch(() => {
      if (sessionRef.current === entry) sessionRef.current = null
    })
    return promise
  }, [cartId, sessionKey, selectedMethodId])

  React.useEffect(() => {
    if (!feeReady || !cartId || hasCompletedOrderRef.current) return
    getClientSecret().catch((error) => {
      console.error('Failed to prepare the payment session', error)
    })
  }, [feeReady, cartId, getClientSecret])

  // The total changed after a session already exists: a stale service fee (item 14's 409) and
  // applying or removing a coupon code both land here. The next session is made fresh.
  const refreshPaymentSession = React.useCallback(() => {
    sessionRef.current = null
    staleSessionRef.current = true
  }, [])

  // Switching between the usual methods and a local one changes the payment's currency; the form
  // follows at once and the matching session is made when the customer pays.
  const selectMethod = React.useCallback((methodId: string | null) => {
    setPickedMethodId(methodId)
  }, [])

  // Drawn at once: from the cart already in memory when the customer comes from the cart page
  // (refreshed in the background; the fee and payment session wait for the fresh copy), or the
  // same layout with grey blocks until the cart has loaded on a direct visit.
  if (!cart || !cartId) {
    return (
      <div className="bg-background min-h-screen font-sans">
        <CartNavbar currentStep={2} />
        <section
          aria-busy
          className="mx-auto grid w-full max-w-310 grid-cols-1 gap-10 px-4 py-10 lg:grid-cols-[1fr_380px] lg:py-16"
        >
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div className="h-6 w-20 animate-pulse rounded bg-white/10" />
              <div className="h-14 animate-pulse rounded-xl bg-white/10" />
            </div>
            <div className="flex flex-col gap-3">
              <div className="mb-1 h-6 w-40 animate-pulse rounded bg-white/10" />
              <div className="h-12 animate-pulse rounded-[6px] bg-white/10" />
              <div className="h-12 animate-pulse rounded-[6px] bg-white/10" />
              <div className="h-12 animate-pulse rounded-[6px] bg-white/10" />
            </div>
            <div className="h-13 animate-pulse rounded-[10px] bg-white/10" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-6 w-36 animate-pulse rounded bg-white/10" />
            <div className="h-64 animate-pulse rounded-2xl bg-white/10" />
          </div>
        </section>
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
          cartId={cartId}
          charge={charge}
          paymentMethodTypes={paymentMethodTypes}
          getClientSecret={getClientSecret}
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
        />
        <CheckoutSummary cart={cart} charge={charge} onCartChanged={refreshPaymentSession} />
      </section>
    </div>
  )
}
