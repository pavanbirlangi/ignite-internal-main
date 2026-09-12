import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SheetClose } from '@/components/ui/sheet'
import { useRouter } from 'next/navigation'
import StarIcon from '../icons/StarIcon'
import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
import { useAuthModalStore } from '@/store/useAuthModalStore'
import { toast } from 'sonner'
import { formatApiCurrency } from './currency'

interface CartFooterProps {
  total: number
  count: number
  currencyCode?: string
}

export const CartFooter = ({ total, count, currencyCode }: CartFooterProps) => {
  const router = useRouter()
  const cart = useCartStore((state) => state.cart)
  const cartCmsData = useCartStore((state) => state.cartCmsData)
  const isCartEmpty = count < 1

  const handlePayNow = () => {
    if (isCartEmpty) {
      toast.error('Your cart is empty. Add items before checkout.')
      return
    }

    const { isAuthenticated } = useUserStore.getState()
    const { openModal } = useAuthModalStore.getState()

    if (!isAuthenticated) {
      toast.info('Please log in to proceed with checkout', {
        duration: 2000,
       position: 'top-right',
      })
      openModal('login')
      return
    }

    if (cart?.checkoutUrl) {
      window.location.href = cart.checkoutUrl
      return
    }

    toast.error('Checkout is currently unavailable. Please refresh your cart.')

    router.push('/cart')
  }

  return (
    <div className="border-muted-foreground bg-background absolute right-0 bottom-0 left-0 z-20 flex w-full flex-col gap-4 px-5 py-4">
      {/* Total Row */}
      <div className="flex w-full flex-col gap-1.5">
        {cart?.discountSummary?.hasDiscount && cart.discountSummary.totalSavings?.amount && parseFloat(cart.discountSummary.totalSavings.amount) > 0 && (
          <div className="flex w-full items-center justify-between">
            <span className="text-[13px] font-medium text-muted-foreground">Discount Savings</span>
            <span className="text-[13px] font-semibold text-white">
              -{formatApiCurrency(parseFloat(cart.discountSummary.totalSavings.amount), cart.discountSummary.totalSavings.currencyCode || currencyCode)}
            </span>
          </div>
        )}
        <div className="flex w-full items-end justify-between pt-2.5 mt-0.5">
          <span className="text-lg font-semibold text-white">Cart Total:</span>
          <span className="text-lg font-semibold text-white">
            {formatApiCurrency(total, currencyCode)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex w-full gap-3">
        <SheetClose asChild>
          <Button
            onClick={() => {
              router.push('/cart')
            }}
            variant="ghost"
            className="bg-secondary border-muted-foreground hover:bg-border h-11 flex-1 rounded-[6px] border-[0.78px] px-4 py-3 text-[15px] font-semibold text-white transition-colors hover:text-white"
          >
            Go To Cart ({count})
          </Button>
        </SheetClose>

        <Button
          onClick={handlePayNow}
          disabled={isCartEmpty}
          className="bg-primary glassmorphism shadow-primary/20 flex h-11 flex-1 items-center justify-center gap-2 rounded-[6px] px-4 py-3 text-[15px] font-semibold text-white shadow-lg transition-colors hover:bg-(--primary-dark) disabled:cursor-not-allowed disabled:opacity-50"
        >
          Pay Now <ChevronRight className="ml-0.5 h-4 w-4" />
        </Button>
      </div>

      <div className="flex w-full items-center justify-center gap-1.5 pt-1 text-[13px]">
        <span className="font-medium">
          See our{' '}
          {cartCmsData?.review_redirect_link ? (
            <a
              href={cartCmsData.review_redirect_link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white underline transition-opacity hover:opacity-80"
            >
              {cartCmsData?.review_count?.trim() || '5,516'} reviews
            </a>
          ) : (
            <span className="font-semibold text-white">
              {cartCmsData?.review_count?.trim() || '5,516'} reviews
            </span>
          )}{' '}
          on
        </span>
        <StarIcon />
        <span className="font-medium text-white">Trustpilot</span>
      </div>
    </div>
  )
}
