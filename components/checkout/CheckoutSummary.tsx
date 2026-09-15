import Image from 'next/image'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getProxyImageUrl } from '@/lib/utils'
import type { CartResponse } from '@/lib/services/cart.service'

interface CheckoutSummaryProps {
  cart: CartResponse
}

export function CheckoutSummary({ cart }: CheckoutSummaryProps) {
  const currency = cart.currencyCode

  return (
    <div className="static w-full lg:sticky lg:top-40">
      <h2 className="mb-5 text-lg font-semibold text-white md:text-xl">
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
                    <span className="line-clamp-1 text-[14px] font-medium text-white">
                      {item.title}
                    </span>
                    <span className="text-muted-foreground text-[12px] font-medium">
                      Qty {item.quantity}
                    </span>
                  </div>
                  <span className="shrink-0 text-[14px] font-semibold text-white">
                    {formatCurrency(item.unitPrice * item.quantity, currency)}
                  </span>
                </div>
              </div>
            ))}

            <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-muted-foreground text-[14px] font-medium">
                Subtotal
              </span>
              <span className="text-[14px] font-semibold text-white">
                {formatCurrency(cart.subtotal, currency)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[14px] font-medium">
                Shipping
              </span>
              <span className="text-[14px] font-semibold text-white">
                Free
              </span>
            </div>

            {cart.taxTotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[14px] font-medium">
                  Tax
                </span>
                <span className="text-[14px] font-semibold text-white">
                  {formatCurrency(cart.taxTotal, currency)}
                </span>
              </div>
            )}

            <div className="mt-1 flex items-start justify-between border-t border-white/10 pt-3">
              <span className="text-[18px] font-semibold text-white">
                Total
              </span>
              <span className="text-[18px] font-semibold text-white">
                {formatCurrency(cart.total, currency)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <p className="text-muted-foreground text-[12px] leading-4.5 font-medium">
            Digital delivery only, nothing is shipped. Your key lands in your
            account the moment payment is confirmed.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
