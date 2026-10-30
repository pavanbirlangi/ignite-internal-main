import Image from 'next/image'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { getProxyImageUrl } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CartProduct } from './types'
import { formatApiCurrency } from './currency'
import { getDiscountPercent } from '@/lib/utils/discount'

interface CartItemProps {
  product: CartProduct & { quantity?: number }
  onRemove: (id: string) => void
  onUpdateQuantity: (id: string, qty: number) => void
  isItemLoading?: boolean
  onNavigate?: () => void
}

export const CartDrawerItem = ({
  product,
  onRemove,
  onUpdateQuantity,
  isItemLoading = false,
  onNavigate,
}: CartItemProps) => {
  const productHref = product.handle ? `/${product.handle}` : undefined
  const quantity = Math.max(1, product.quantity ?? 1)
  const quantityOptions = Array.from(
    { length: Math.max(9, quantity) },
    (_, index) => index + 1,
  )

  const discount =
    typeof product.originalPrice === 'number' && product.originalPrice > product.price
      ? getDiscountPercent(product.originalPrice, product.price)
      : 0

  return (
    // Rows split by a thin line rather than boxed cards.
    <div className="border-border group relative flex flex-col gap-4 border-b py-4 first:pt-0">
      <div className="flex gap-4">
        {/* Image */}
        {productHref ? (
          <Link
            href={productHref}
            onClick={onNavigate}
            className={`relative block h-20 w-16 shrink-0 overflow-hidden rounded-lg ${product.availableForSale === false ? 'opacity-50 grayscale' : ''}`}
          >
            <Image
              src={getProxyImageUrl(product.image)}
              alt={product.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          </Link>
        ) : (
          <div
            className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-lg ${product.availableForSale === false ? 'opacity-50 grayscale' : ''}`}
          >
            <Image
              src={getProxyImageUrl(product.image)}
              alt={product.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between py-0.5">
          <div className="flex flex-col gap-1 pr-8">
            {productHref ? (
              <Link
                href={productHref}
                onClick={onNavigate}
                className="line-clamp-2 text-sm font-bold text-white/95 hover:underline"
              >
                {product.title}
              </Link>
            ) : (
              <h4 className="line-clamp-2 text-sm font-bold text-white/95">
                {product.title}
              </h4>
            )}
            {/* {product.platform && (
              <p className="text-white/65 text-xs font-medium sm:text-xs">
                {product.platform}
              </p>
            )} */}
            {product.availableForSale === false && (
              <span className="text-red text-xs font-bold uppercase">
                Out of Stock
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-white/95">
              {formatApiCurrency(product.price, product.currencyCode)}
            </span>
            {typeof product.originalPrice === 'number' &&
              product.originalPrice > product.price && (
                <span className="text-white/65 text-sm font-medium line-through">
                  {formatApiCurrency(
                    product.originalPrice,
                    product.currencyCode,
                  )}
                </span>
              )}
            {/* Same badge as the product cards. */}
            {discount > 0 && (
              <span className="bg-deal flex h-[22px] items-center rounded-[6px] px-2">
                <span className="trim block text-xs font-medium text-white/95">
                  -{discount}%
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Actions (Qty + Delete) */}
        <div
          className="flex flex-col items-end justify-between gap-2"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {/* Quantity Select - Styled to match reference */}
          <Select
            disabled={isItemLoading || product.availableForSale === false}
            value={quantity.toString()}
            onValueChange={(val) =>
              onUpdateQuantity(product.id, Number.parseInt(val, 10))
            }
          >
            <SelectTrigger
              className={`bg-card! border-border flex h-8 min-w-12.5 gap-1 rounded-lg border px-2.5 text-sm font-medium text-white/95 transition-colors focus:ring-0 focus:ring-offset-0 data-[state=open]:border-primary/70 ${isItemLoading || product.availableForSale === false ? 'cursor-not-allowed opacity-50' : 'hover:border-white/20 hover:text-white'}`}
            >
              <SelectValue placeholder="1" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border min-w-12.5 rounded-xl border p-1 text-white/95">
              {quantityOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Delete Icon - Red Trash Can */}
          <button
            onClick={() => onRemove(product.id)}
            disabled={isItemLoading}
            className={`rounded-lg p-1.5 text-white/45 transition-colors ${isItemLoading ? 'cursor-not-allowed opacity-50' : 'hover:text-red cursor-pointer hover:bg-white/5'}`}
            aria-label="Remove item"
          >
            <Trash2 className="size-[18px]" />
          </button>
        </div>
      </div>
    </div>
  )
}
