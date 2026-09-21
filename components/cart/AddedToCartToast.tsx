'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { getProxyImageUrl } from '@/lib/utils'
import { formatMedusaAmount } from '@/lib/currency'

interface AddedToCartToastProps {
  title: string
  thumbnail?: string
  unitPrice: number
  quantity: number
  currencyCode: string
  onDismiss: () => void
}

function AddedToCartToast({
  title,
  thumbnail,
  unitPrice,
  quantity,
  currencyCode,
  onDismiss,
}: AddedToCartToastProps) {
  const router = useRouter()

  // Same locale-less paths the cart drawer/footer already push to -- proxy.ts
  // adds the locale prefix on the redirect, so hardcoding one here would
  // produce a double prefix.
  const go = (path: string) => {
    onDismiss()
    router.push(path)
  }

  return (
    <div className="bg-secondary border-border w-full rounded-xl border p-4 shadow-2xl sm:w-90">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/15">
            <Check className="h-3.5 w-3.5 text-green-500" strokeWidth={3} />
          </span>
          <span className="text-sm font-semibold text-white">Added to cart</span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-muted-foreground cursor-pointer rounded p-0.5 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 flex gap-3">
        <div className="bg-background relative h-16 w-13 shrink-0 overflow-hidden rounded-lg">
          {thumbnail ? (
            <Image
              src={getProxyImageUrl(thumbnail)}
              alt={title}
              fill
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <p className="line-clamp-2 text-sm leading-snug font-semibold text-white">
            {title}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              {formatMedusaAmount(unitPrice, currencyCode)}
            </span>
            {quantity > 1 && (
              <span className="text-muted-foreground text-xs font-medium">
                x{quantity}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => go('/cart')}
          className="border-border flex-1 cursor-pointer rounded-[6px] border bg-transparent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
        >
          View cart
        </button>
        <button
          type="button"
          onClick={() => go('/checkout')}
          className="bg-primary hover:bg-primary/90 flex-1 cursor-pointer rounded-[6px] py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Checkout
        </button>
      </div>
    </div>
  )
}

/**
 * Mini-cart confirmation popup shown after a successful add-to-cart, in place
 * of the old plain "Added to cart" text toast. Exported as a function rather
 * than a component so `store/useCartStore.ts` (a plain .ts file, no JSX) can
 * trigger it from the one place every add-to-cart path already funnels
 * through.
 *
 * Pinned bottom-right per toast rather than globally -- the app's `<Toaster>`
 * stays top-center for every other toast.
 */
export function showAddedToCartToast(item: {
  title: string
  thumbnail?: string
  unitPrice: number
  quantity: number
  currencyCode: string
}) {
  toast.custom(
    (id) => <AddedToCartToast {...item} onDismiss={() => toast.dismiss(id)} />,
    { position: 'bottom-right', duration: 6000 },
  )
}
