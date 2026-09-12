import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CartProduct } from './types'
import CartPlusIcon from '../icons/CartPlusIcon'
import { formatApiCurrency } from './currency'
import { getProxyImageUrl } from '@/lib/utils'

interface RecommendationRowProps {
  product: CartProduct
  onAddToCart: (product: CartProduct) => void
  onNavigate?: () => void
}

export const RecommendationRow = ({
  product,
  onAddToCart,
  onNavigate,
}: RecommendationRowProps) => {
  const isAddDisabled =
    !product.merchandiseId || product.availableForSale === false
  const productHref = product.handle ? `/${product.handle}` : null

  return (
    <div className="bg-secondary group flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors sm:gap-3 sm:px-4 sm:py-2.5">
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

      {/* Content */}
      <div className="flex flex-1 flex-col justify-center gap-1">
        {productHref ? (
          <Link href={productHref} onClick={onNavigate} className="w-fit">
            <h4 className="line-clamp-2 text-xs leading-snug font-semibold text-white hover:underline sm:text-sm">
              {product.title}
            </h4>
          </Link>
        ) : (
          <h4 className="line-clamp-2 text-xs leading-snug font-semibold text-white sm:text-sm">
            {product.title}
          </h4>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-white sm:text-sm">
            {formatApiCurrency(product.price, product.currencyCode)}
          </span>
          {typeof product.originalPrice === 'number' &&
            product.originalPrice > product.price && (
              <span className="text-muted-foreground text-[10px] font-medium line-through sm:text-xs">
                {formatApiCurrency(product.originalPrice, product.currencyCode)}
              </span>
            )}
        </div>
        {product.availableForSale === false && (
          <span className="text-red text-[10px] font-bold sm:text-xs">
            Out of stock
          </span>
        )}
      </div>

      {/* Add Cart Action - Circle Button style */}
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onAddToCart(product)}
        disabled={isAddDisabled}
        className="border-muted-foreground h-8 w-8 rounded-lg border bg-transparent text-white transition-all duration-200 hover:border-white hover:bg-white/10 sm:h-9 sm:w-9"
      >
        <div className="scale-75">
          <CartPlusIcon />
        </div>
      </Button>
    </div>
  )
}
