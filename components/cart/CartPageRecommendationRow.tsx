import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CartProduct } from './types'
import CartPlusIcon from '../icons/CartPlusIcon'
import { formatApiCurrency } from './currency'
import { getProxyImageUrl } from '@/lib/utils'

interface CartPageRecommendationRowProps {
  product: CartProduct
  onAddToCart: (product: CartProduct) => Promise<unknown> | unknown
}

export function CartPageRecommendationRow({
  product,
  onAddToCart,
}: CartPageRecommendationRowProps) {
  const [isAdding, setIsAdding] = useState(false)
  const isAddDisabled =
    !product.merchandiseId || product.availableForSale === false
  const productHref = product.handle ? `/${product.handle}` : null

  const handleAddToCart = async () => {
    if (isAddDisabled || isAdding) return

    setIsAdding(true)
    try {
      await Promise.resolve(onAddToCart(product))
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="group bg-secondary/20 flex items-center gap-2 rounded-[12px] border border-transparent px-3 py-2 transition-colors sm:gap-3 sm:px-4 sm:py-2.5">
      {productHref ? (
        <Link
          href={productHref}
          className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md"
        >
          <Image
            src={getProxyImageUrl(product.image)}
            alt={product.title}
            fill
            className="object-cover"
          />
        </Link>
      ) : (
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md">
          <Image
            src={getProxyImageUrl(product.image)}
            alt={product.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col justify-center gap-2">
        {productHref ? (
          <Link href={productHref} className="w-fit">
            <h4 className="line-clamp-2 leading-snug font-semibold text-white hover:underline sm:text-sm">
              {product.title}
            </h4>
          </Link>
        ) : (
          <h4 className="line-clamp-2 leading-snug font-semibold text-white sm:text-sm">
            {product.title}
          </h4>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-white sm:text-sm">
            {formatApiCurrency(product.price, product.currencyCode)}
          </span>
        </div>

        {product.availableForSale === false && (
          <span className="text-red text-[10px] font-bold sm:text-xs">
            Out of stock
          </span>
        )}
      </div>

      <Button
        size="icon"
        variant="ghost"
        onClick={handleAddToCart}
        disabled={isAddDisabled || isAdding}
        className="border-muted-foreground h-8 w-8 rounded-lg border bg-transparent text-white transition-all duration-200 hover:border-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9"
      >
        <CartPlusIcon className="size-4 sm:size-5" />
      </Button>
    </div>
  )
}
