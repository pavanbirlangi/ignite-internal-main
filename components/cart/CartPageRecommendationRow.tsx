import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { CartProduct } from './types'
import { formatApiCurrency } from './currency'
import { cn, getProxyImageUrl } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

interface CartPageRecommendationRowProps {
  product: CartProduct
  /** Resolves true once the item is in the cart. */
  onAddToCart: (product: CartProduct) => Promise<boolean>
}

// A suggestion line: cover, title and price, and an Add button that spins while adding and then
// draws a tick (same feedback as the product cards and the quick cart).
export function CartPageRecommendationRow({ product, onAddToCart }: CartPageRecommendationRowProps) {
  const [addState, setAddState] = useState<'idle' | 'loading' | 'done'>('idle')
  const isAddDisabled = !product.merchandiseId || product.availableForSale === false
  const productHref = product.handle ? `/${product.handle}` : null

  const handleAdd = async () => {
    if (addState !== 'idle') return
    setAddState('loading')
    const [added] = await Promise.all([
      onAddToCart(product),
      new Promise((resolve) => setTimeout(resolve, 450)),
    ])
    if (!added) {
      setAddState('idle')
      return
    }
    setAddState('done')
    window.setTimeout(() => setAddState('idle'), 1600)
  }

  const cover = (
    <Image src={getProxyImageUrl(product.image)} alt={product.title} fill sizes="48px" className="object-cover" />
  )

  return (
    <div className="flex items-center gap-3.5 px-4 py-3">
      {productHref ? (
        <Link href={productHref} className="bg-secondary relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-lg">
          {cover}
        </Link>
      ) : (
        <div className="bg-secondary relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-lg">{cover}</div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {productHref ? (
          <Link href={productHref} className="line-clamp-2 text-sm leading-5 font-bold wrap-break-word text-white/95 hover:underline">
            {product.title}
          </Link>
        ) : (
          <h4 className="line-clamp-2 text-sm leading-5 font-bold wrap-break-word text-white/95">{product.title}</h4>
        )}
        <div className="flex flex-wrap items-center gap-x-2 text-sm">
          <span className="whitespace-nowrap text-white/65">{formatApiCurrency(product.price, product.currencyCode)}</span>
          {typeof product.originalPrice === 'number' && product.originalPrice > product.price && (
            <span className="text-[13px] whitespace-nowrap text-white/45 line-through">
              {formatApiCurrency(product.originalPrice, product.currencyCode)}
            </span>
          )}
        </div>
        {product.availableForSale === false && <span className="text-xs font-bold text-[#FF6B76]">Out of stock</span>}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={isAddDisabled || addState !== 'idle'}
        aria-label={`Add ${product.title} to cart`}
        aria-busy={addState === 'loading' || undefined}
        className={cn(
          'bg-secondary border-border relative inline-flex h-9.5 min-w-19 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border px-3 text-[13px] font-medium text-white/95 transition-all duration-200 outline-none hover:-translate-y-px hover:border-white/25 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-default disabled:hover:translate-y-0',
          addState === 'done' && 'border-[#22C55E]/40 bg-[#22C55E]/14 text-[#4ADE80] hover:bg-[#22C55E]/14',
          isAddDisabled && 'opacity-50',
        )}
      >
        <span className={cn('inline-flex items-center gap-1.5', addState !== 'idle' && 'invisible')}>
          <ShoppingCart className="size-4" />
          Add
        </span>
        {addState === 'loading' && (
          <span className="absolute inset-0 grid place-items-center">
            <Spinner className="size-4.5" />
          </span>
        )}
        {addState === 'done' && (
          <span className="absolute inset-0 grid place-items-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-4">
              <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray={1} className="animate-check-draw" />
            </svg>
          </span>
        )}
      </button>
    </div>
  )
}
