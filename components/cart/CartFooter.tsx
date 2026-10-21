import { useTransition } from 'react'
import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SheetClose } from '@/components/ui/sheet'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCartStore } from '@/store/useCartStore'
import { ensureCheckoutAllowed } from '@/lib/utils/checkout-guard'
import { formatApiCurrency } from './currency'

interface CartFooterProps {
  total: number
  count: number
  currencyCode?: string
  /** Shown above the buttons, and Checkout is disabled (e.g. a sold-out item is in the cart). */
  blockedReason?: string
}

export const CartFooter = ({ total, count, currencyCode, blockedReason }: CartFooterProps) => {
  const router = useRouter()
  const cartCmsData = useCartStore((state) => state.cartCmsData)
  // Spins until the checkout page has loaded.
  const [isOpeningCheckout, startOpeningCheckout] = useTransition()
  const isCartEmpty = count < 1

  const handlePayNow = () => {
    if (isCartEmpty) {
      toast.error('Your cart is empty. Add items before checkout.')
      return
    }

    if (!ensureCheckoutAllowed()) return

    startOpeningCheckout(() => router.push('/checkout'))
  }

  return (
    <div className="border-border bg-card absolute right-0 bottom-0 left-0 z-20 flex w-full flex-col gap-4 border-t px-6 pt-4 pb-5">
      {/* Savings are shown on the cart page; the drawer keeps to the total. */}
      <div className="flex w-full items-baseline justify-between">
        <span className="text-base font-medium text-white/65">Cart total</span>
        <span className="text-xl font-bold text-white/95">
          {formatApiCurrency(total, currencyCode)}
        </span>
      </div>

      {blockedReason && (
        <p role="alert" className="-my-1 text-[13px] leading-[18px] font-medium text-[#FF7088]">
          {blockedReason}
        </p>
      )}

      <div className="grid w-full grid-cols-2 gap-3">
        <SheetClose asChild>
          <Button
            onClick={() => router.push('/cart')}
            variant="secondary"
            className="border-border h-11 rounded-lg border bg-transparent text-sm font-medium hover:bg-white/5 md:text-sm"
          >
            View cart ({count})
          </Button>
        </SheetClose>

        {/* Same hover as the hero's Browse Deals button: a light sweep and
            a sliding arrow. */}
        <Button
          variant="primary"
          onClick={handlePayNow}
          disabled={isCartEmpty || Boolean(blockedReason)}
          loading={isOpeningCheckout}
          className="group/cta relative h-11 overflow-hidden rounded-lg text-sm md:text-sm"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/4 -translate-x-full skew-x-[-20deg] bg-white/25 blur-[2px] transition-transform duration-700 ease-out group-hover/cta:translate-x-[700%] motion-reduce:hidden"
          />
          Checkout
          <ChevronRight className="-mr-1 size-4 transition-transform duration-300 ease-out group-hover/cta:translate-x-1" />
        </Button>
      </div>

      {/* Text link only (no Trustpilot logo or typed-in review count); same
          as the footer. The profile link is Directus-managed (/items/cart). */}
      {cartCmsData?.review_redirect_link && (
        <a
          href={cartCmsData.review_redirect_link}
          target="_blank"
          rel="noopener noreferrer"
          className="group/tp flex items-center justify-center gap-1.5 text-xs text-white/65 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="size-3.5 shrink-0 fill-(--trustpilot-green)">
            <path d="M12 2.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.7l7.1-.6z" />
          </svg>
          Check out our reviews on{' '}
          <span className="font-medium text-(--trustpilot-green)">Trustpilot</span>
          <ArrowUpRight className="size-3 transition-transform group-hover/tp:translate-x-0.5 group-hover/tp:-translate-y-0.5" />
        </a>
      )}
    </div>
  )
}
