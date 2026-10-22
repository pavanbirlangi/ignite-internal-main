import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Minus, Plus } from 'lucide-react'
import { CartProduct } from './types'
import { formatApiCurrency } from './currency'
import { cn, getProxyImageUrl } from '@/lib/utils'
import { getDiscountPercent } from '@/lib/utils/discount'

interface CartItemRowProps {
  item: CartProduct
  quantity: number
  onUpdateQuantity: (id: string, qty: number) => void
  onRemove: (id: string) => void
  isItemLoading?: boolean
}

const QTY_BUTTON_CLASS =
  'grid size-8.5 cursor-pointer place-items-center text-white/65 transition-colors outline-none hover:text-white focus-visible:text-white disabled:pointer-events-none disabled:opacity-40'

// One line in the cart panel: cover, title and tags, then remove + quantity on the left and the
// price (with the discount and old price) on the right. Rows are separated by the panel's dividers.
export function CartItemRow({
  item,
  quantity,
  onUpdateQuantity,
  onRemove,
  isItemLoading = false,
}: CartItemRowProps) {
  const productHref = item.handle ? `/${item.handle}` : undefined
  const soldOut = item.availableForSale === false
  const hasDiscount = typeof item.originalPrice === 'number' && item.originalPrice > item.price
  const discount = hasDiscount ? getDiscountPercent(item.originalPrice as number, item.price) : 0

  const cover = (
    <Image
      src={getProxyImageUrl(item.image)}
      alt={item.title}
      fill
      className="object-cover"
      sizes="(max-width: 640px) 72px, 88px"
    />
  )
  const coverClass = cn(
    'bg-secondary relative block aspect-[3/4] w-18 shrink-0 overflow-hidden rounded-[10px] sm:w-22',
    soldOut ? 'opacity-50 grayscale' : 'transition-opacity hover:opacity-90',
  )

  return (
    <div className={cn('flex gap-3.5 p-4 sm:gap-4 sm:p-5', isItemLoading && 'opacity-60')}>
      {productHref ? (
        <Link href={productHref} className={coverClass}>
          {cover}
        </Link>
      ) : (
        <div className={coverClass}>{cover}</div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {productHref ? (
          <Link
            href={productHref}
            className="line-clamp-2 text-sm leading-5 font-bold wrap-break-word text-white/95 hover:underline sm:text-base sm:leading-[22px]"
          >
            {item.title}
          </Link>
        ) : (
          <h3 className="line-clamp-2 text-sm leading-5 font-bold wrap-break-word text-white/95 sm:text-base sm:leading-[22px]">
            {item.title}
          </h3>
        )}

        {/* The platform with its icon, as on the product page (e.g. Steam, Microsoft Store). */}
        {(soldOut || item.platformInfo) && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            {soldOut && (
              <span className="bg-deal inline-flex h-5.5 items-center rounded-md px-2 text-xs font-bold text-white uppercase">
                Out of Stock
              </span>
            )}
            {item.platformInfo && (
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[13px] leading-[18px] text-white/65">
                {item.platformInfo.icon && (
                  <Image
                    src={item.platformInfo.icon}
                    alt=""
                    width={16}
                    height={16}
                    className="size-4 shrink-0 object-contain"
                  />
                )}
                <span className="truncate">{item.platformInfo.name}</span>
              </span>
            )}
          </div>
        )}

        {/* Wraps onto two lines on narrow phones instead of overflowing the panel */}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
          <div className="flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              disabled={isItemLoading}
              title="Remove from cart"
              aria-label="Remove item"
              className="grid size-9 cursor-pointer place-items-center rounded-[10px] text-white/45 transition-colors outline-none hover:bg-[#F04452]/10 hover:text-[#F04452] focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-40"
            >
              <Trash2 className="size-4" />
            </button>
            <div className="bg-background border-border inline-flex h-9 items-center rounded-[10px] border">
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.id, Math.max(1, quantity - 1))}
                disabled={isItemLoading || soldOut || quantity <= 1}
                title="Decrease quantity"
                aria-label="Decrease quantity"
                className={QTY_BUTTON_CLASS}
              >
                <Minus className="size-3.5" />
              </button>
              <span className="min-w-7 text-center text-sm font-medium text-white/95">{quantity}</span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                disabled={isItemLoading || soldOut}
                title="Increase quantity"
                aria-label="Increase quantity"
                className={QTY_BUTTON_CLASS}
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="ml-auto flex flex-col items-end gap-1">
            {hasDiscount && !soldOut && (
              <div className="flex items-center gap-2">
                <span className="bg-deal inline-flex h-5.5 items-center rounded-md px-1.5 text-xs font-medium whitespace-nowrap text-white">
                  -{discount}%
                </span>
                <span className="text-[13px] whitespace-nowrap text-white/45 line-through">
                  {formatApiCurrency(item.originalPrice as number, item.currencyCode)}
                </span>
              </div>
            )}
            <span className="text-base font-bold whitespace-nowrap text-white/95 sm:text-lg">
              {soldOut ? 'Out of Stock' : formatApiCurrency(item.price, item.currencyCode)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

