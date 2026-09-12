import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Minus, Plus } from 'lucide-react'
import { CartProduct } from './types'
import { Badge } from '@/components/ui/badge'
import { formatApiCurrency } from './currency'
import { getProxyImageUrl } from '@/lib/utils'

interface CartItemRowProps {
  item: CartProduct
  quantity: number
  onUpdateQuantity: (id: string, qty: number) => void
  onRemove: (id: string) => void
  isItemLoading?: boolean
}

export function CartItemRow({
  item,
  quantity,
  onUpdateQuantity,
  onRemove,
  isItemLoading = false,
}: CartItemRowProps) {
  const productHref = item.handle ? `/${item.handle}` : undefined

  return (
    <div className="group bg-secondary/20 relative flex flex-row gap-2 rounded-[12px] border border-transparent p-2 transition-all hover:border-white/5 sm:gap-3 sm:p-3">
      {/* Product Image */}
      {productHref ? (
        <Link
          href={productHref}
          className={`relative block h-24 w-18 shrink-0 overflow-hidden rounded-lg transition-opacity sm:h-40 sm:w-32 ${
            item.availableForSale === false
              ? 'opacity-50 grayscale'
              : 'hover:opacity-90'
          }`}
        >
          <Image
            src={getProxyImageUrl(item.image)}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 72px, 128px"
            priority={false}
          />
        </Link>
      ) : (
        <div
          className={`relative h-24 w-18 shrink-0 overflow-hidden rounded-lg transition-opacity sm:h-40 sm:w-32 ${
            item.availableForSale === false ? 'opacity-50 grayscale' : ''
          }`}
        >
          <Image
            src={getProxyImageUrl(item.image)}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 72px, 128px"
          />
        </div>
      )}

      {/* Content Container */}
      <div className="flex flex-1 flex-col justify-between py-1 sm:py-1.5">
        {/* Title & Header */}
        <div className="flex flex-col gap-1.5 sm:gap-2.5">
          {productHref ? (
            <Link
              href={productHref}
              className="line-clamp-2 max-w-full font-semibold text-white transition-colors hover:text-white/80 hover:underline sm:text-[16px] sm:leading-6"
            >
              {item.title}
            </Link>
          ) : (
            <h3 className="line-clamp-2 max-w-full font-semibold text-white sm:text-[16px] sm:leading-6">
              {item.title}
            </h3>
          )}
          {/* {item.platform && (
            <p className="text-muted-foreground text-xs leading-none font-medium sm:text-[11px]">
              {item.platform}
            </p>
          )} */}

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {item.availableForSale === false && (
              <Badge className="bg-red/10 text-red hover:bg-red/20 rounded-sm border-0 px-1.5 py-0.5 text-[8px] font-bold tracking-wide uppercase sm:text-[9px]">
                Out of Stock
              </Badge>
            )}
            {item.badges &&
              item.badges.length > 0 &&
              item.badges.map((badge) => (
                <Badge
                  key={badge}
                  className="bg-primary hover:bg-primary rounded-sm border-0 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-white uppercase sm:text-[9px]"
                >
                  {badge}
                </Badge>
              ))}
          </div>

          {/* Mobile Price */}
          <div className="mt-1 flex items-center gap-2 sm:hidden">
            {item.availableForSale === false ? (
              <span className="text-red text-[12px] font-bold">
                Out of Stock
              </span>
            ) : (
              <>
                <span className="text-[13px] font-bold text-white">
                  {formatApiCurrency(item.price, item.currencyCode)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Bottom Actions Row */}
        <div className="border-secondary mt-2 flex flex-col justify-between gap-2.5 border-t pt-2 sm:mt-0 sm:flex-row sm:items-center sm:gap-3">
          {/* Left: Trash & Quantity */}
          <div
            className="flex w-full items-center justify-between gap-2.5 sm:w-auto sm:justify-start sm:gap-3.5"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => onRemove(item.id)}
              disabled={isItemLoading}
              className={`inline-flex items-center justify-center rounded-lg transition-colors ${
                isItemLoading
                  ? 'cursor-not-allowed opacity-50'
                  : 'text-red hover:bg-red/10 hover:text-red active:bg-red/20'
              }`}
              title="Remove from cart"
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Quantity Selector */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2.5">
              <button
                onClick={() =>
                  onUpdateQuantity(item.id, Math.max(1, quantity - 1))
                }
                disabled={isItemLoading || item.availableForSale === false}
                className="border-secondary bg-secondary hover:bg-secondary/80 flex h-7 w-6 items-center justify-center rounded-md border transition-colors disabled:opacity-50 sm:h-7.5 sm:w-8"
                title="Decrease quantity"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3" />
              </button>

              <div className="bg-background border-secondary flex h-7 w-8 items-center justify-center rounded-md border text-center text-[12px] font-semibold text-white sm:w-9 sm:text-[13px]">
                {quantity}
              </div>

              <button
                onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                disabled={isItemLoading || item.availableForSale === false}
                className="border-secondary bg-secondary hover:bg-secondary/80 flex h-7 w-6 items-center justify-center rounded-md border transition-colors disabled:opacity-50 sm:h-7.5 sm:w-8"
                title="Increase quantity"
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Right: Price (Desktop Only) */}
          <div className="hidden flex-col items-end gap-0.5 sm:flex">
            {item.availableForSale === false ? (
              <span className="text-red text-[13px] font-bold sm:text-[15px]">
                Out of Stock
              </span>
            ) : (
              <span className="text-[13px] font-bold text-white sm:text-[16px]">
                {formatApiCurrency(item.price, item.currencyCode)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
