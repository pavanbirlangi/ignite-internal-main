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
import {
  PaymentFailed,
  type PaymentFailureVariant,
} from '@/components/checkout/PaymentFailed'
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
    // Stripe styles its own fields with standard CSS weights, so these have
    // to be standard values that resolve to a real face registered below --
    // this app's own scale (705/707/709/711) means nothing inside the iframe.
    fontWeightLight: '300',
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    fontWeightBold: '700',
  },
  rules: {
    '.Input': {
      border: '1px solid #3A3A3A',
      backgroundColor: '#171717',
      // Matches the email field directly above it (INPUT_CLASS: text-sm,
      // font-semibold), rather than Stripe's 16px/400 default. Set on the
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
// (app/globals.css), so the faces have to be handed to Stripe explicitly.
//
// Registered against **standard** CSS weights, deliberately not the ones
// globals.css uses. This app runs on Cooper Hewitt's real numeric weights
// (body is 705, medium 707, semibold 709, bold 711), but Stripe styles its
// own fields with ordinary 400/500/600 -- so registering only 300/707/709/711
// left every weight Stripe asks for with no matching face, and the browser
// fell back to the nearest one available: 300 (Light). That's what made the
// card fields look wrong -- thin Light digits sitting next to the app's own
// semibold email input. Mapping the same files onto the weights Stripe
// actually requests is what fixes it.
const FONT_WEIGHT_TO_FILE: Array<{ weight: string; file: string }> = [
  { weight: '300', file: 'CooperHewitt-Light.woff2' },
  { weight: '400', file: 'CooperHewitt-Medium.woff2' },
  { weight: '500', file: 'CooperHewitt-Medium.woff2' },
  { weight: '600', file: 'CooperHewitt-Semibold.woff2' },
  { weight: '700', file: 'CooperHewitt-Bold.woff2' },
]

function getStripeFonts(): CustomFontSource[] {
  if (typeof window === 'undefined') return []
  const origin = window.location.origin
  return FONT_WEIGHT_TO_FILE.map(({ weight, file }) => ({
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
  // Only set for failures that warrant the full explanation panel. Simple
  // "fix this field and resubmit" validation stays as inline red text --
  // a whole alert block for a mistyped email would be noise.
  const [failure, setFailure] = useState<PaymentFailureVariant | null>(null)

  const clearErrors = () => {
    setErrorMessage(null)
    setFailure(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    if (!EMAIL_PATTERN.test(email.trim())) {
      setErrorMessage('Please add a valid email address above.')
      return
    }

    setSubmitting(true)
    clearErrors()

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
        setErrorMessage(error.message ?? null)
        // Stripe's own taxonomy: card_error/validation_error are the
        // customer-fixable ones (declined, wrong CVC, expired). Anything
        // else at this point is our problem, not theirs.
        setFailure(
          error.type === 'card_error' || error.type === 'validation_error'
            ? 'declined'
            : 'generic',
        )
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
        // The backend deliberately returns a vague message here; don't
        // surface it as a "reason" the customer can act on.
        setErrorMessage(null)
        setFailure('blocked')
      } else {
        setErrorMessage(extractApiErrorMessage(err, ''))
        setFailure('generic')
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

      {/* A real failure gets the full explanation panel; plain field
          validation stays as one line of red text. */}
      {failure ? (
        <PaymentFailed
          variant={failure}
          message={errorMessage}
          // The form and its payment details are still mounted underneath,
          // so "try again" just clears the panel rather than reloading
          // anything -- the customer can swap the card and resubmit.
          onRetry={failure === 'blocked' ? undefined : clearErrors}
          onBackToCart={() => router.push('/cart')}
        />
      ) : (
        errorMessage && (
          <p className="text-red text-sm font-semibold">{errorMessage}</p>
        )
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
