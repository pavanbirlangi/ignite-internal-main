import Image from 'next/image'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getProxyImageUrl } from '@/lib/utils'
import type { CartResponse } from '@/lib/services/cart.service'
import { CouponInput } from './CouponInput'

// What the customer is actually charged: the payment method's currency and the exact amount in it.
export interface CheckoutCharge {
  currency: string
  amount: number
}

interface CheckoutSummaryProps {
  cart: CartResponse
  charge: CheckoutCharge
  onCartChanged: () => void
}

// "USD 10.28" -- the ISO code rather than a symbol, since "$" alone is ambiguous next to a total
// shown in another currency.
const formatCharge = ({ currency, amount }: CheckoutCharge) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      currencyDisplay: 'code',
    }).format(amount)
  } catch {
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`
  }
}

export function CheckoutSummary({ cart, charge, onCartChanged }: CheckoutSummaryProps) {
  // Everything is shown in the display currency; the charge line appears only when the payment
  // method charges in a different one (e.g. a EUR total paid by card in USD), as on Driffle.
  const currency = cart.currencyCode
  const showCharge = charge.currency.toLowerCase() !== currency.toLowerCase()

  return (
    <div className="static w-full lg:sticky lg:top-40">
      <h2 className="mb-5 text-xl font-bold text-white/95 md:text-xl">
        Order Summary
      </h2>

      <Card className="bg-secondary/20 overflow-hidden rounded-[12px] border-0">
        <CardHeader className="px-6 py-4">
          <div className="flex flex-col gap-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="bg-background relative h-16 w-14 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={getProxyImageUrl(item.thumbnail) || '/images/product/cover.png'}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="line-clamp-1 text-sm font-medium text-white/95">
                      {item.title}
                    </span>
                    <span className="text-white/65 text-xs font-medium">
                      Qty {item.quantity}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-white/95">
                    {formatCurrency(item.unitPrice * item.quantity, currency)}
                  </span>
                </div>
              </div>
            ))}

            <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-white/65 text-sm font-medium">
                Subtotal
              </span>
              <span className="text-sm font-bold text-white/95">
                {formatCurrency(cart.subtotal, currency)}
              </span>
            </div>

            {cart.serviceFee > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-white/65 text-sm font-medium">
                  {cart.serviceFeeLabel}
                </span>
                <span className="text-sm font-bold text-white/95">
                  {formatCurrency(cart.serviceFee, currency)}
                </span>
              </div>
            )}

            {cart.taxTotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-white/65 text-sm font-medium">
                  Tax
                </span>
                <span className="text-sm font-bold text-white/95">
                  {formatCurrency(cart.taxTotal, currency)}
                </span>
              </div>
            )}

            {cart.discountTotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-white/65 text-sm font-medium">
                  Discount{cart.promoCodes[0] ? ` (${cart.promoCodes[0]})` : ''}
                </span>
                <span className="text-destructive text-sm font-bold">
                  -{formatCurrency(cart.discountTotal, currency)}
                </span>
              </div>
            )}

            <div className="mt-1 flex items-start justify-between border-t border-white/10 pt-3">
              <span className="text-xl font-bold text-white/95">
                Total
              </span>
              <span className="text-xl font-bold text-white/95">
                {formatCurrency(cart.total, currency)}
              </span>
            </div>

            {showCharge && (
              <p className="text-white/65 -mt-2 text-right text-xs font-bold uppercase">
                You will pay{' '}
                <span className="text-white/95">{formatCharge(charge)}</span>
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 px-6 pb-6">
          <CouponInput onCartChanged={onCartChanged} />
          <p className="text-white/65 text-xs font-medium">
            Digital delivery only, nothing is shipped. Your key lands in your
            account the moment payment is confirmed.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
