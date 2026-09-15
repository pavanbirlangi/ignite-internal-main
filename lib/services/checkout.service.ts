import medusaClient from '../medusa-axios'

export interface StripePaymentSession {
  id: string
  providerId: string
  clientSecret: string
}

export interface CompleteCartResult {
  status: 'order'
  orderId: string
}

// Distinct from a network/validation error -- Medusa's own risk-fraud gate on
// `POST /store/carts/:id/complete` returns this specific shape (confirmed
// live against a real 409 in an earlier phase's testing, see
// MEDUSA_MIGRATION_GAP_TRACKER.md's G-CHECKOUT-04) and needs its own message,
// not a generic "something went wrong."
export class CheckoutRiskBlockedError extends Error {
  constructor(message = "This order could not be completed.") {
    super(message)
    this.name = 'CheckoutRiskBlockedError'
  }
}

const STRIPE_PROVIDER_ID = 'pp_stripe_stripe'
const DIGITAL_SHIPPING_OPTION_NAME = 'Digital Delivery'

export const checkoutService = {
  /**
   * Sets only the cart's email -- confirmed live that Medusa's `complete`
   * does NOT require a billing/shipping address at all (a cart with no
   * address ever set gets past `complete` cleanly; the only rejection it
   * returns is about the payment session not being authorized yet). Tax
   * still computes correctly off the auto-stubbed shipping address Medusa
   * creates from the cart's own region when a shipping method is attached
   * (see `ensureDigitalShippingMethod`), so no address UI is needed here --
   * matches the deliberately address-free checkout flow (payment method +
   * email only) this was modeled on.
   */
  setCartEmail: async (cartId: string, email: string): Promise<void> => {
    const encodedId = encodeURIComponent(cartId)
    await medusaClient.post(`/store/carts/${encodedId}`, { email })
  },

  /**
   * The store only ever has one real shipping option (a $0 "Digital
   * Delivery" option, provisioned per-region -- confirmed live, see
   * G-CHECKOUT-03) -- no picker UI needed, just resolve and attach it if the
   * cart doesn't already have a shipping method.
   */
  ensureDigitalShippingMethod: async (cartId: string): Promise<void> => {
    const encodedId = encodeURIComponent(cartId)
    const { data } = await medusaClient.get('/store/shipping-options', {
      params: { cart_id: cartId },
    })
    const option =
      (data.shipping_options ?? []).find(
        (o: any) => o.name === DIGITAL_SHIPPING_OPTION_NAME,
      ) ?? data.shipping_options?.[0]

    if (!option) {
      throw new Error('No shipping option is configured for this region.')
    }

    await medusaClient.post(`/store/carts/${encodedId}/shipping-methods`, {
      option_id: option.id,
    })
  },

  /**
   * Reuses an existing Stripe payment session on the cart's payment
   * collection if one already exists (confirmed live: both persist across
   * page reloads via `GET /store/carts/:id`) instead of creating a new
   * payment collection/session on every mount, which would otherwise orphan
   * a fresh Stripe PaymentIntent each time the checkout page reloads.
   */
  getOrCreateStripeSession: async (
    cartId: string,
  ): Promise<StripePaymentSession> => {
    const encodedId = encodeURIComponent(cartId)
    const { data: cartData } = await medusaClient.get(
      `/store/carts/${encodedId}`,
      {
        params: {
          fields:
            'id,+payment_collection.id,+payment_collection.payment_sessions.id,+payment_collection.payment_sessions.provider_id,+payment_collection.payment_sessions.data',
        },
      },
    )

    let paymentCollectionId: string | undefined =
      cartData.cart?.payment_collection?.id
    const existingSession = (
      cartData.cart?.payment_collection?.payment_sessions ?? []
    ).find((s: any) => s.provider_id === STRIPE_PROVIDER_ID)

    if (existingSession?.data?.client_secret) {
      return {
        id: existingSession.id,
        providerId: STRIPE_PROVIDER_ID,
        clientSecret: existingSession.data.client_secret,
      }
    }

    if (!paymentCollectionId) {
      const { data: pcData } = await medusaClient.post(
        '/store/payment-collections',
        { cart_id: cartId },
      )
      paymentCollectionId = pcData.payment_collection.id
    }

    const { data: sessionData } = await medusaClient.post(
      `/store/payment-collections/${paymentCollectionId}/payment-sessions`,
      { provider_id: STRIPE_PROVIDER_ID },
    )
    const session = (sessionData.payment_collection.payment_sessions ?? []).find(
      (s: any) => s.provider_id === STRIPE_PROVIDER_ID,
    )
    if (!session?.data?.client_secret) {
      throw new Error('Stripe did not return a usable payment session.')
    }

    return {
      id: session.id,
      providerId: STRIPE_PROVIDER_ID,
      clientSecret: session.data.client_secret,
    }
  },

  /**
   * Converts the cart into a real order. Medusa's own risk-fraud gate can
   * return HTTP 409 here (confirmed in an earlier phase, see
   * G-CHECKOUT-04) -- surfaced as a distinct error type so the UI can show a
   * real "we couldn't process this order" message instead of a generic one.
   */
  completeCart: async (cartId: string): Promise<CompleteCartResult> => {
    const encodedId = encodeURIComponent(cartId)
    try {
      const { data } = await medusaClient.post(
        `/store/carts/${encodedId}/complete`,
      )
      if (data.type === 'order' && data.order?.id) {
        return { status: 'order', orderId: data.order.id }
      }
      throw new Error(
        data.error?.message ?? 'The cart could not be completed. Please review your order and try again.',
      )
    } catch (error: any) {
      if (error?.response?.status === 409) {
        throw new CheckoutRiskBlockedError(
          error.response.data?.message,
        )
      }
      throw error
    }
  },
}
