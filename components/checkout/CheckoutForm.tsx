'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Pencil } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import {
  loadStripe,
  type Appearance,
  type CssFontSource,
  type PaymentIntent,
  type StripeExpressCheckoutElementConfirmEvent,
  type StripeExpressCheckoutElementReadyEvent,
} from '@stripe/stripe-js'
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Input } from '@/components/ui/input'
import {
  checkoutService,
  CheckoutOutOfStockError,
  CheckoutRiskBlockedError,
  ServiceFeeOutOfDateError,
} from '@/lib/services/checkout.service'
import { extractApiErrorMessage } from '@/lib/utils/api-error'
import { localizedHref } from '@/lib/utils'
import { useCartStore } from '@/store/useCartStore'
import type { PaymentMethodOption } from '@/lib/services/checkout.service'
import { formatCurrency } from '@/lib/currency'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
)

// Matches this app's dark theme tokens (app/globals.css .dark block). Stripe
// Elements render inside a cross-origin iframe and can't read the page's own
// CSS custom properties, so the actual hex values are passed in directly.
const stripeAppearance: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#2468DF',
    colorBackground: '#161616',
    colorText: '#FFFFFF',
    colorTextSecondary: '#9A9A9A',
    colorDanger: '#CD000E',
    borderRadius: '6px',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeightLight: '300',
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    fontWeightBold: '700',
  },
  rules: {
    '.Input': {
      border: '1px solid #2E2E2E',
      backgroundColor: '#0C0C0C',
      // Matches the email field directly above it (INPUT_CLASS: text-sm,
      // font-bold), rather than Stripe's 16px/400 default. Set on the
      // input specifically instead of via fontSizeBase, which would shrink
      // the labels too.
      fontSize: '14px',
      fontWeight: '600',
    },
    '.Label': {
      fontWeight: '500',
    },
    '.Input:focus': {
      border: '1px solid #2468DF',
      boxShadow: 'none',
    },
    '.Tab': {
      border: '1px solid #2E2E2E',
      backgroundColor: '#0C0C0C',
    },
    '.Tab--selected': {
      border: '1px solid #2468DF',
    },
  },
}

// The Payment Element's iframe is a separate, cross-origin document with no
// access to this app's fonts, so Inter is handed to Stripe explicitly (the
// same weights the site uses: 400/500/700).
const STRIPE_FONTS: CssFontSource[] = [
  {
    cssSrc:
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap',
  },
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface CheckoutFormProps {
  cartId: string
  clientSecret: string
  email: string
  locale: string
  onOrderCompleted: () => void
  // Called when /complete refuses the order because the cart's service fee went stale between
  // session creation and now (item/region changed, or the fee setting flipped mid-checkout). The
  // parent re-fetches a fresh payment session with the corrected amount and remounts this form.
  onServiceFeeStale: () => void
  onEmailChange?: (email: string) => void
  // Local payment methods for this visitor's country (charged in their own currency), and which
  // one is selected (null = the usual USD methods). Empty for most visitors: no choice is shown.
  localMethods?: PaymentMethodOption[]
  selectedMethodId?: string | null
  onSelectMethod?: (methodId: string | null) => void
  switchingMethod?: boolean
  methodError?: string | null
}

// Same look as Stripe's own method rows below it (stripeAppearance: .Tab border and background).
function MethodOption({
  selected,
  disabled,
  title,
  detail,
  onSelect,
}: {
  selected: boolean
  disabled: boolean
  title: string
  detail: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-3 rounded-[6px] border bg-background px-4 py-3.5 text-left transition-colors disabled:cursor-wait ${
        selected ? 'border-[#2468DF]' : 'border-border hover:border-[#474747]'
      }`}
    >
      <span className="flex items-center gap-3">
        <span
          className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
            selected ? 'border-[#2468DF]' : 'border-[#6A6A6A]'
          }`}
        >
          {selected && <span className="size-2 rounded-full bg-[#2468DF]" />}
        </span>
        <span className="text-sm font-bold text-white/95">{title}</span>
      </span>
      <span className="text-white/65 text-xs font-medium">{detail}</span>
    </button>
  )
}

function EmailStep({
  email,
  onChange,
}: {
  email: string
  onChange: (value: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(email)
  const [error, setError] = useState<string | null>(null)

  const startEditing = () => {
    setDraft(email)
    setError(null)
    setIsEditing(true)
  }

  const save = () => {
    if (!EMAIL_PATTERN.test(draft.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    onChange(draft.trim())
    setIsEditing(false)
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-white/95 md:text-xl">
        Email
      </h2>
      <div className="bg-card border-border flex min-h-14 items-center justify-between gap-3 rounded-xl border py-2 pr-2 pl-4">
        {isEditing ? (
          <Input
            type="email"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), save())}
            placeholder="you@example.com"
            aria-label="Email address"
            autoComplete="email"
            autoFocus
            className="h-10 min-w-0 border-0 bg-transparent px-0 text-sm! font-medium text-white/95 shadow-none placeholder:text-white/45 focus-visible:ring-0 sm:text-base! md:text-base!"
          />
        ) : (
          <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-white/95 sm:text-base">
            <Mail className="size-4 shrink-0 text-white/45" />
            <span className="truncate">{email}</span>
          </span>
        )}

        <button
          type="button"
          onClick={isEditing ? save : startEditing}
          className="bg-secondary border-border inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium text-white/95 transition-colors outline-none hover:border-white/25 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40"
        >
          {isEditing ? (
            'Save'
          ) : (
            <>
              <Pencil className="size-3.5" />
              <span className="max-sm:sr-only">Edit email</span>
              <span className="sm:hidden">Edit</span>
            </>
          )}
        </button>
      </div>
      {error ? (
        <p className="text-red mt-2 text-xs font-bold">{error}</p>
      ) : (
        <p className="text-white/65 mt-2 text-xs">
          Your key and receipt are sent to this email.
        </p>
      )}
    </div>
  )
}

function CheckoutFormInner({
  cartId,
  email: initialEmail,
  locale,
  onOrderCompleted,
  onServiceFeeStale,
  onEmailChange,
  localMethods = [],
  selectedMethodId = null,
  onSelectMethod,
  switchingMethod = false,
  methodError = null,
}: Omit<CheckoutFormProps, 'clientSecret'>) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const clearCart = useCartStore((state) => state.clearCart)
  const applyServiceFee = useCartStore((state) => state.applyServiceFee)
  const cart = useCartStore((state) => state.cart)
  const [email, setEmail] = useState(initialEmail)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Express buttons (Apple Pay, Google Pay, Link) shown above the card form only when at least one
  // is available, so there's no empty gap otherwise.
  const [hasWallets, setHasWallets] = useState(false)

  const returnUrl = () =>
    `${window.location.origin}${localizedHref(locale, '/checkout/complete')}?cart_id=${cartId}`

  // No address form is shown here; Medusa's own checkout doesn't require one to complete an order.
  // Email and a payment method are all that's needed (see checkout.service.ts).
  const prepareCart = async () => {
    // Only when it differs -- saves a round-trip on the usual path.
    if (cart?.email !== email.trim()) {
      await checkoutService.setCartEmail(cartId, email.trim())
    }
    await checkoutService.ensureDigitalShippingMethod(cartId)
  }

  const isPaid = (paymentIntent?: PaymentIntent) =>
    paymentIntent?.status === 'requires_capture' || paymentIntent?.status === 'succeeded'

  const completeOrder = async () => {
    const result = await checkoutService.completeCart(cartId)
    // Tell the parent page to stop watching the cart before touching it
    // at all -- CheckoutPageContent redirects to /cart the instant it
    // sees an empty cart, and clearing the cart here re-renders that
    // still-mounted component synchronously, ahead of router.push
    // actually completing navigation. Reordering push-then-clear alone
    // wasn't enough to win that race; this closes it properly.
    onOrderCompleted()
    clearCart()
    router.push(`/order/confirmation/${result.orderId}`)
  }

  // Some local methods are confirmed later, e.g. MB WAY once the customer approves it in their
  // bank's app. The completion page waits for that and then places the order.
  const waitForPayment = (paymentIntentClientSecret: string) => {
    onOrderCompleted()
    router.push(
      `/checkout/complete?cart_id=${encodeURIComponent(cartId)}&payment_intent_client_secret=${encodeURIComponent(paymentIntentClientSecret)}`,
    )
  }

  const handleCompletionError = async (err: unknown) => {
    if (err instanceof ServiceFeeOutOfDateError) {
      // The charge that just went through was for the OLD total -- it must not be silently
      // retried. Re-sync the fee, get a fresh payment session for the corrected amount, and
      // make the customer explicitly review and submit again.
      setErrorMessage(
        'Your order total changed. Please review it below and submit payment again.',
      )
      try {
        await applyServiceFee()
      } catch (syncError) {
        console.error('Failed to re-sync service fee after 409', syncError)
      }
      onServiceFeeStale()
    } else if (err instanceof CheckoutOutOfStockError) {
      // "Sold out: <titles>. Remove it from the cart to continue."
      setErrorMessage(err.message)
    } else if (err instanceof CheckoutRiskBlockedError) {
      setErrorMessage(
        err.message ||
          "We couldn't process this order. Please contact support or try a different payment method.",
      )
    } else {
      setErrorMessage(
        extractApiErrorMessage(err, 'Something went wrong completing your order.'),
      )
    }
    setSubmitting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    if (!EMAIL_PATTERN.test(email.trim())) {
      setErrorMessage('Please add a valid email address above.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      await prepareCart()

      const { error: submitError } = await elements.submit()
      if (submitError) {
        setErrorMessage(
          submitError.message ?? 'Please check your payment details.',
        )
        setSubmitting(false)
        return
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl() },
        redirect: 'if_required',
      })

      if (error) {
        setErrorMessage(error.message ?? 'Payment failed. Please try again.')
        setSubmitting(false)
        return
      }

      // Card payments (and most non-redirect methods) resolve right here
      // without ever leaving the page. Methods that must redirect (some
      // wallets and bank redirects) never reach this line -- the browser
      // has already navigated to return_url above, and /checkout/complete
      // finishes the job when the customer comes back.
      if (isPaid(paymentIntent)) {
        await completeOrder()
        return
      }

      if (paymentIntent?.status === 'processing' && paymentIntent.client_secret) {
        waitForPayment(paymentIntent.client_secret)
        return
      }

      setSubmitting(false)
    } catch (err) {
      await handleCompletionError(err)
    }
  }

  // Apple Pay / Google Pay: the customer approved the payment in the wallet sheet. Same steps as
  // "Pay now", without the card form's own validation (elements.submit), which would fail on the
  // empty card fields. Telling the sheet about a failure closes it with an error.
  const handleExpressConfirm = async (event: StripeExpressCheckoutElementConfirmEvent) => {
    if (!stripe || !elements) return

    if (!EMAIL_PATTERN.test(email.trim())) {
      event.paymentFailed({ reason: 'fail' })
      setErrorMessage('Please add a valid email address above.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      await prepareCart()

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl() },
        redirect: 'if_required',
      })

      if (error) {
        event.paymentFailed({ reason: 'fail' })
        setErrorMessage(error.message ?? 'Payment failed. Please try again.')
        setSubmitting(false)
        return
      }

      if (isPaid(paymentIntent)) {
        await completeOrder()
        return
      }

      if (paymentIntent?.status === 'processing' && paymentIntent.client_secret) {
        waitForPayment(paymentIntent.client_secret)
        return
      }

      setSubmitting(false)
    } catch (err) {
      event.paymentFailed({ reason: 'fail' })
      await handleCompletionError(err)
    }
  }

  const handleExpressReady = ({ availablePaymentMethods }: StripeExpressCheckoutElementReadyEvent) => {
    setHasWallets(
      Boolean(
        availablePaymentMethods?.applePay ||
          availablePaymentMethods?.googlePay ||
          availablePaymentMethods?.link,
      ),
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <EmailStep
        email={email}
        onChange={(nextEmail) => {
          setEmail(nextEmail)
          onEmailChange?.(nextEmail)
        }}
      />

      <div>
        <h2 className="mb-4 text-xl font-bold text-white/95 md:text-xl">
          Payment method
        </h2>
        {localMethods.length > 0 && (
          <div role="radiogroup" aria-label="Payment method" className="mb-4 flex flex-col gap-2">
            <MethodOption
              selected={!selectedMethodId}
              disabled={switchingMethod}
              title="Card, wallets & Alipay"
              detail="Charged in USD"
              onSelect={() => onSelectMethod?.(null)}
            />
            {localMethods.map((method) => (
              <MethodOption
                key={method.id}
                selected={selectedMethodId === method.id}
                disabled={switchingMethod}
                title={method.label}
                detail={
                  method.chargeAmount !== null
                    ? `Charged in ${method.chargeCurrency.toUpperCase()} · ${formatCurrency(method.chargeAmount, method.chargeCurrency.toUpperCase())}`
                    : `Charged in ${method.chargeCurrency.toUpperCase()}`
                }
                onSelect={() => onSelectMethod?.(method.id)}
              />
            ))}
            {methodError && <p className="text-red text-xs font-bold">{methodError}</p>}
          </div>
        )}
        {/* Wallet and Link buttons belong to the USD payment; a local method's payment can't use them. */}
        <div className={hasWallets && !selectedMethodId ? 'mb-4' : 'invisible h-0 overflow-hidden'}>
          <ExpressCheckoutElement
            options={{
              // 'always' also offers Apple Pay in Chrome/Edge/Firefox on desktop (the customer
              // scans a code with their iPhone); 'auto' shows it in Safari only. Link gets its
              // own one-click button here too (it is offered in every region).
              paymentMethods: {
                applePay: 'always',
                googlePay: 'always',
                link: 'auto',
                amazonPay: 'never',
                paypal: 'never',
                klarna: 'never',
              },
              buttonHeight: 48,
            }}
            onReady={handleExpressReady}
            onConfirm={handleExpressConfirm}
          />
        </div>
        <PaymentElement />
        <p className="text-white/65 mt-2 text-xs">
          Some cards ask for a billing postal code here. That's Stripe
          verifying the card, not a separate address form.
        </p>
      </div>

      {errorMessage && (
        <p className="text-red text-sm font-bold">{errorMessage}</p>
      )}

      {/* Same hover and loading as the cart's Proceed button */}
      <button
        type="submit"
        disabled={!stripe || switchingMethod || submitting}
        aria-busy={submitting || undefined}
        className="group/cta bg-primary relative flex h-13 w-full cursor-pointer items-center justify-center overflow-hidden rounded-[10px] text-[15px] font-medium text-white shadow-[0_10px_30px_-8px_var(--primary-glow-60)] transition-all duration-200 outline-none hover:-translate-y-px hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/40 active:translate-y-0 disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:brightness-100"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/4 -translate-x-full skew-x-[-20deg] bg-white/25 blur-[2px] transition-transform duration-700 ease-out group-hover/cta:translate-x-[700%] motion-reduce:hidden"
        />
        <span className={submitting ? 'invisible inline-flex items-center gap-2' : 'inline-flex items-center gap-2'}>
          <Lock className="size-4" />
          Pay now
        </span>
        {submitting && (
          <span className="absolute inset-0 grid place-items-center">
            <Spinner className="size-5.5" />
          </span>
        )}
      </button>
    </form>
  )
}

export function CheckoutForm({
  cartId,
  clientSecret,
  email,
  locale,
  onOrderCompleted,
  onServiceFeeStale,
  onEmailChange,
  localMethods,
  selectedMethodId,
  onSelectMethod,
  switchingMethod,
  methodError,
}: CheckoutFormProps) {
  return (
    // Keyed on clientSecret: @stripe/react-stripe-js does not reinitialize Elements when the
    // clientSecret option changes on an already-mounted provider, so a corrected payment session
    // (see onServiceFeeStale) needs a real remount to take effect.
    <Elements
      key={clientSecret}
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: stripeAppearance,
        fonts: STRIPE_FONTS,
      }}
    >
      <CheckoutFormInner
        cartId={cartId}
        email={email}
        locale={locale}
        onOrderCompleted={onOrderCompleted}
        onServiceFeeStale={onServiceFeeStale}
        onEmailChange={onEmailChange}
        localMethods={localMethods}
        selectedMethodId={selectedMethodId}
        onSelectMethod={onSelectMethod}
        switchingMethod={switchingMethod}
        methodError={methodError}
      />
    </Elements>
  )
}
