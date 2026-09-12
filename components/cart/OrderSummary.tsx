import { ChevronRight, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import StarIcon from '../icons/StarIcon'
import { useCartStore } from '@/store/useCartStore'

interface OrderSummaryProps {
  basePrice: number
  total: number
  currency: string
  onCheckout: () => void
}

export function OrderSummary({
  basePrice,
  total,
  currency,
  onCheckout,
}: OrderSummaryProps) {
  const cartCmsData = useCartStore((state) => state.cartCmsData)
  const discountSummary = useCartStore((state) => state.cart?.discountSummary)
  const fees = useCartStore((state) => state.cart?.fees)

  return (
    <div className="static w-full lg:sticky lg:top-40">
      <h2 className="mb-5 text-lg font-semibold text-white md:text-xl">
        Order Summary
      </h2>

      <Card className="bg-secondary/20 mb-2 overflow-hidden rounded-[12px] border-0">
        <CardHeader className="px-6 py-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[14px] font-medium">
                Base Price
              </span>
              <span className="text-[14px] font-semibold text-white">
                {formatCurrency(basePrice, currency)}
              </span>
            </div>

            {discountSummary?.hasDiscount &&
              discountSummary.totalSavings?.amount &&
              parseFloat(discountSummary.totalSavings.amount) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[14px] font-medium">
                    Discount Savings
                  </span>
                  <span className="text-[14px] font-semibold text-white">
                    -
                    {formatCurrency(
                      parseFloat(discountSummary.totalSavings.amount),
                      discountSummary.totalSavings.currencyCode || currency,
                    )}
                  </span>
                </div>
              )}

            {fees?.serviceCharge?.amount &&
              parseFloat(fees.serviceCharge.amount) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[14px] font-medium">
                    Service Fee
                  </span>
                  <span className="text-[14px] font-semibold text-white">
                    {formatCurrency(
                      parseFloat(fees.serviceCharge.amount),
                      fees.serviceCharge.currencyCode || currency,
                    )}
                  </span>
                </div>
              )}

            {fees?.userCharge?.amount &&
              parseFloat(fees.userCharge.amount) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[14px] font-medium">
                    User Fee
                  </span>
                  <span className="text-[14px] font-semibold text-white">
                    {formatCurrency(
                      parseFloat(fees.userCharge.amount),
                      fees.userCharge.currencyCode || currency,
                    )}
                  </span>
                </div>
              )}

            <div className="mt-1 flex items-start justify-between border-t border-white/10 pt-3">
              <CardTitle className="text-[18px] font-semibold text-white">
                Your cart total
              </CardTitle>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[18px] font-semibold text-white">
                  {formatCurrency(total, currency)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6">
          <Button
            className="bg-primary hover:bg-primary/90 mb-2 h-12 w-full gap-1.5 rounded-[6px] px-11 py-4 !text-[16px] font-semibold text-white"
            onClick={onCheckout}
          >
            Proceed to Checkout
            <ChevronRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
      {cartCmsData?.acknowledgement_text ? (
        <div
          className="text-muted-foreground prose-a:text-primary prose-a:underline px-2 text-[12px] leading-4.5 font-medium"
          dangerouslySetInnerHTML={{ __html: cartCmsData.acknowledgement_text }}
        />
      ) : (
        <p className="text-muted-foreground px-2 text-[12px] leading-4.5 font-medium">
          By proceeding through checkout, I acknowledge I have read and accepted
          the{' '}
          <span className="text-primary underline">Terms and Conditions</span>{' '}
          including the{' '}
          <span className="text-primary underline">Privacy Policy</span> and
          <span className="text-primary underline"> Refund Policy.</span>
        </p>
      )}
      <div className="flex flex-col items-center justify-center gap-3 py-4 sm:flex-row">
        <span className="text-[14px] font-medium text-white">
          See our{' '}
          {cartCmsData?.review_redirect_link ? (
            <a
              href={cartCmsData.review_redirect_link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline transition-opacity hover:opacity-80"
            >
              {cartCmsData?.review_count?.trim() || '5,516'} reviews
            </a>
          ) : (
            <span className="font-semibold">
              {cartCmsData?.review_count?.trim() || '5,516'} reviews
            </span>
          )}{' '}
          on
        </span>
        <div className="flex items-center gap-1">
          <StarIcon />
          <span className="text-[14px] font-bold text-white">Trustpilot</span>
        </div>
      </div>
    </div>
  )
}
