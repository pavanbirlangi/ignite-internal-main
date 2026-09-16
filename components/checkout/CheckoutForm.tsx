'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Pencil } from 'lucide-react'
import {
  loadStripe,
  type Appearance,
  type CustomFontSource,
} from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  checkoutService,
  CheckoutRiskBlockedError,
} from '@/lib/services/checkout.service'
import { extractApiErrorMessage } from '@/lib/utils/api-error'
import { useCartStore } from '@/store/useCartStore'

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
    colorBackground: '#2B2B2B',
    colorText: '#FFFFFF',
    colorTextSecondary: '#9A9A9A',
    colorDanger: '#CD000E',
    borderRadius: '6px',
    fontFamily: 'Cooper Hewitt, system-ui, sans-serif',
  },
  rules: {
    '.Input': {
      border: '1px solid #3A3A3A',
      backgroundColor: '#171717',
    },
    '.Input:focus': {
      border: '1px solid #2468DF',
      boxShadow: 'none',
    },
    '.Tab': {
      border: '1px solid #3A3A3A',
      backgroundColor: '#171717',
    },
    '.Tab--selected': {
      border: '1px solid #2468DF',
    },
  },
}

// `fontFamily: 'Cooper Hewitt'` above only names the font -- it doesn't make
// the Payment Element's iframe able to render it. The iframe is a separate,
// cross-origin document with no access to this app's own @font-face rules
// (app/globals.css), so without this it silently falls back to the
// browser's generic sans-serif, which is what actually caused the mismatch
// (not a Stripe limitation -- Stripe Elements supports custom fonts exactly
// for this reason, it just also needs to be told to load ours). Same
// Cooper Hewitt files/weights app/globals.css already declares.
function getStripeFonts(): CustomFontSource[] {
  if (typeof window === 'undefined') return []
  const origin = window.location.origin
  return [
    { weight: '300', file: 'CooperHewitt-Light.woff2' },
    { weight: '707', file: 'CooperHewitt-Medium.woff2' },
    { weight: '709', file: 'CooperHewitt-Semibold.woff2' },
    { weight: '711', file: 'CooperHewitt-Bold.woff2' },
  ].map(({ weight, file }) => ({
    family: 'Cooper Hewitt',
    src: `url(${origin}/fonts/cooper-hewitt/${file}) format("woff2")`,
    weight,
  }))
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface CheckoutFormProps {
  cartId: string
  clientSecret: string
  email: string
  locale: string
  onOrderCompleted: () => void
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
      <h2 className="mb-4 text-lg font-semibold text-white md:text-xl">
        Email
      </h2>
      <div className="bg-secondary/20 flex items-center justify-between gap-3 rounded-lg border border-white/10 px-4 py-3">
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
            className="border-0 bg-transparent px-0"
          />
        ) : (
          <span className="flex items-center gap-2 text-[15px] font-medium text-white">
            <Mail className="text-primary size-4 shrink-0" />
            {email}
          </span>
        )}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={isEditing ? save : startEditing}
          className="shrink-0"
        >
          {isEditing ? (
            'Save'
          ) : (
            <>
              <Pencil className="size-3.5" />
              Edit email
            </>
          )}
        </Button>
      </div>
      {error ? (
        <p className="text-red mt-2 text-xs font-semibold">{error}</p>
      ) : (
        <p className="text-muted-foreground mt-2 text-xs">
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
}: Omit<CheckoutFormProps, 'clientSecret'>) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const clearCart = useCartStore((state) => state.clearCart)
  const [email, setEmail] = useState(initialEmail)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
      // No address form is shown here; Medusa's own checkout doesn't require
      // one to complete an order. Email and a payment method are all that's
      // needed (see checkout.service.ts).
      await checkoutService.setCartEmail(cartId, email.trim())
      await checkoutService.ensureDigitalShippingMethod(cartId)

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
        confirmParams: {
          return_url: `${window.location.origin}/${locale}/checkout/complete?cart_id=${cartId}`,
        },
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
      if (
        paymentIntent &&
        (paymentIntent.status === 'requires_capture' ||
          paymentIntent.status === 'succeeded')
      ) {
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
        return
      }

      setSubmitting(false)
    } catch (err: any) {
      if (err instanceof CheckoutRiskBlockedError) {
        setErrorMessage(
          err.message ||
            "We couldn't process this order. Please contact support or try a different payment method.",
        )
      } else {
        setErrorMessage(
          extractApiErrorMessage(
            err,
            'Something went wrong completing your order.',
          ),
        )
      }
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <EmailStep email={email} onChange={setEmail} />

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white md:text-xl">
          Payment method
        </h2>
        <PaymentElement />
        <p className="text-muted-foreground mt-2 text-xs">
          Some cards ask for a billing postal code here. That's Stripe
          verifying the card, not a separate address form.
        </p>
      </div>

      {errorMessage && (
        <p className="text-red text-sm font-semibold">{errorMessage}</p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={!stripe || submitting}
        className="w-full"
      >
        {submitting ? 'Processing...' : 'Pay now'}
      </Button>
    </form>
  )
}

export function CheckoutForm({
  cartId,
  clientSecret,
  email,
  locale,
  onOrderCompleted,
}: CheckoutFormProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: stripeAppearance,
        fonts: getStripeFonts(),
      }}
    >
      <CheckoutFormInner
        cartId={cartId}
        email={email}
        locale={locale}
        onOrderCompleted={onOrderCompleted}
      />
    </Elements>
  )
}
