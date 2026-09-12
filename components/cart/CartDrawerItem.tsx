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

  return (
    <div className="bg-card glassmorphism group relative flex flex-col gap-4 rounded-[20px] border px-5 py-3">
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
                className="line-clamp-2 text-sm leading-snug font-semibold text-white hover:underline"
              >
                {product.title}
              </Link>
            ) : (
              <h4 className="line-clamp-2 text-sm leading-snug font-semibold text-white">
                {product.title}
              </h4>
            )}
            {/* {product.platform && (
              <p className="text-muted-foreground text-[10px] leading-none font-medium sm:text-[11px]">
                {product.platform}
              </p>
            )} */}
            {product.availableForSale === false && (
              <span className="text-red text-[10px] font-semibold tracking-wide uppercase">
                Out of Stock
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {formatApiCurrency(product.price, product.currencyCode)}
            </span>
            {typeof product.originalPrice === 'number' &&
              product.originalPrice > product.price && (
                <span className="text-muted-foreground text-xs font-medium line-through">
                  {formatApiCurrency(
                    product.originalPrice,
                    product.currencyCode,
                  )}
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
              className={`bg-background! text-foreground border-secondary flex h-7.5 min-w-12.5 gap-1 rounded-[6px] border p-2 text-sm font-semibold transition-colors focus:ring-0 focus:ring-offset-0 ${isItemLoading || product.availableForSale === false ? 'cursor-not-allowed opacity-50' : 'hover:bg-secondary hover:text-white'}`}
            >
              <SelectValue placeholder="1" />
            </SelectTrigger>
            <SelectContent className="bg-background text-foreground border-secondary min-w-12.5">
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
            className={`rounded-md p-1.5 text-(--red-500) transition-colors ${isItemLoading ? 'cursor-not-allowed opacity-50' : 'hover:text-red cursor-pointer hover:bg-white/5'}`}
            aria-label="Remove item"
          >
            <Trash2 className="size-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
