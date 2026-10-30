import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CartProduct } from './types'
import CartPlusIcon from '../icons/CartPlusIcon'
import { formatApiCurrency } from './currency'
import { cn, getProxyImageUrl } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

interface RecommendationRowProps {
  product: CartProduct
  /** Resolves true once the item is in the cart. */
  onAddToCart: (product: CartProduct) => Promise<boolean>
  onNavigate?: () => void
}

export const RecommendationRow = ({
  product,
  onAddToCart,
  onNavigate,
}: RecommendationRowProps) => {
  // Same feedback as the product cards' Add: a spinner ring, then a drawn
  // tick. The drawer keeps the row on screen briefly so the tick is seen.
  const [addState, setAddState] = useState<'idle' | 'loading' | 'done'>('idle')
  const isAddDisabled =
    !product.merchandiseId || product.availableForSale === false

  const handleAdd = async () => {
    if (addState !== 'idle') return
    setAddState('loading')
    const [added] = await Promise.all([
      onAddToCart(product),
      new Promise((resolve) => setTimeout(resolve, 450)),
    ])
    setAddState(added ? 'done' : 'idle')
  }
  const productHref = product.handle ? `/${product.handle}` : null

  return (
    <div className="group flex items-center gap-2 py-2 sm:gap-3">
      {/* Image */}
      {productHref ? (
        <Link
          href={productHref}
          onClick={onNavigate}
          className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md"
        >
          <Image
            src={getProxyImageUrl(product.image)}
            alt={product.title}
            fill
            sizes="48px"
            className="object-cover"
          />
        </Link>
      ) : (
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md">
          <Image
            src={getProxyImageUrl(product.image)}
            alt={product.title}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col justify-center gap-1">
        {productHref ? (
          <Link href={productHref} onClick={onNavigate} className="w-fit">
            <h4 className="line-clamp-2 text-xs font-bold text-white/95 hover:underline sm:text-sm">
              {product.title}
            </h4>
          </Link>
        ) : (
          <h4 className="line-clamp-2 text-xs font-bold text-white/95 sm:text-sm">
            {product.title}
          </h4>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-white/95 sm:text-sm">
            {formatApiCurrency(product.price, product.currencyCode)}
          </span>
          {typeof product.originalPrice === 'number' &&
            product.originalPrice > product.price && (
              <span className="text-sm font-medium text-white/65 line-through">
                {formatApiCurrency(product.originalPrice, product.currencyCode)}
              </span>
            )}
        </div>
        {product.availableForSale === false && (
          <span className="text-red text-xs font-bold sm:text-xs">
            Out of stock
          </span>
        )}
      </div>

      {/* Add Cart Action - Circle Button style */}
      <Button
        size="icon"
        variant="ghost"
        onClick={handleAdd}
        disabled={isAddDisabled || addState !== 'idle'}
        aria-label={`Add ${product.title} to cart`}
        aria-busy={addState === 'loading'}
        className={cn(
          'border-border h-8 w-8 rounded-lg border bg-white/5 text-white/95 transition-colors duration-200 hover:border-white/20 hover:bg-white/10 disabled:opacity-100 sm:h-9 sm:w-9',
          addState === 'done' && 'border-primary/60 bg-primary/15',
          isAddDisabled && 'disabled:opacity-50',
        )}
      >
        {addState === 'loading' ? (
          <Spinner className="size-5" />
        ) : addState === 'done' ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="size-4"
          >
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              pathLength={1}
              strokeDasharray={1}
              className="animate-check-draw"
            />
          </svg>
        ) : (
          <div className="scale-75">
            <CartPlusIcon />
          </div>
        )}
      </Button>
    </div>
  )
}
