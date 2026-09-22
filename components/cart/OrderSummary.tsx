import { ChevronRight } from 'lucide-react'
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
  const reviewCount = cartCmsData?.review_count?.trim()
  // "1 reviews" reads as broken -- the CMS holds a plain string, so the
  // plural is decided here.
  const reviewLabel = reviewCount === '1' ? 'review' : 'reviews'

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

            {/* No promotion module or fee-line decision exists yet, so
                discount/fee rows never render -- see cart.service.ts. */}

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

      {/* Trustpilot badge -- renders only when the CMS actually has a review
          count, rather than falling back to a hardcoded figure the way this
          block originally did. The count and the profile link are both
          Directus-managed (`/items/cart`). */}
      {reviewCount && (
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
                {reviewCount} {reviewLabel}
              </a>
            ) : (
              <span className="font-semibold">
                {reviewCount} {reviewLabel}
              </span>
            )}{' '}
            on
          </span>
          <div className="flex items-center gap-1">
            <StarIcon />
            <span className="text-[14px] font-bold text-white">Trustpilot</span>
          </div>
        </div>
      )}
    </div>
  )
}
