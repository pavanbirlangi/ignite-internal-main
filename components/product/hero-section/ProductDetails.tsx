'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import HeartIcon from '@/components/icons/HeartIcon'
import type { Product } from '@/types/product'
import { useUserStore } from '@/store/useUserStore'
import { useAuthModalStore } from '@/store/useAuthModalStore'
import { useWishlistStatus, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist'
import { useProductPurchase } from '@/hooks/useProductPurchase'
import { localizedHref, cn } from '@/lib/utils'
import type { CmsMappedDropdownGroup } from '@/lib/services/cms-product.service'
import { AddToCartButton, BuyNowButton, PriceNotFinal, ProductPrice } from '@/components/product/purchase-ui'

// The sliding buy bar watches this button to know when the panel has scrolled out of view.
export const PRODUCT_BUY_BUTTON_ID = 'product-buy-now'

interface ProductDetailsProps {
  product: Product
  cmsDropdownOptions?: CmsMappedDropdownGroup[]
  locale?: string
  labels: {
    priceNotFinal: string
    priceNotFinalTip: string
    buyNow: string
    addToCart: string
    outOfStock: string
    notAvailable: string
  }
}

const FIELD_CLASS =
  'flex h-11 w-full items-center justify-between gap-2 rounded-[10px] border border-white/10 bg-white/3 px-3.5 text-sm font-medium text-white/95'

// The buy panel in the product hero: price, variant fields, Buy now, Add to cart and wishlist.
export default function ProductDetails({ product, cmsDropdownOptions = [], locale, labels }: ProductDetailsProps) {
  const router = useRouter()
  const { isAuthenticated } = useUserStore()
  const { openModal } = useAuthModalStore()
  const { data: statusData, isLoading: isStatusLoading } = useWishlistStatus(product.id, isAuthenticated)
  const { mutate: addToWishlist, isPending: isAdding } = useAddToWishlist()
  const { mutate: removeFromWishlist, isPending: isRemoving } = useRemoveFromWishlist()
  const isInWishlist = !!statusData?.isInWishlist
  const isWishlistLoading = isStatusLoading || isAdding || isRemoving

  const { variant, isPriced, canBuy, price, compareAtPrice, discountPercent, addState, addToCart, buyNow, isOpening } =
    useProductPurchase(product)

  // Each option of a Directus dropdown links to another product page; the active one matches
  // the current page (or is the first option).
  const activeLabels = useMemo<Record<string, string>>(
    () =>
      cmsDropdownOptions.reduce<Record<string, string>>((acc, group) => {
        const active = group.options.find((option) => option.isActive) ?? group.options[0]
        if (active) acc[group.id] = active.label
        return acc
      }, {}),
    [cmsDropdownOptions],
  )
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)

  const selectOption = (slug: string) => {
    setOpenGroupId(null)
    if (!slug || slug === product.handle) return
    router.push(locale ? localizedHref(locale, `/${slug}`) : `/${slug}`)
  }

  const toggleWishlist = () => {
    if (!isAuthenticated) {
      openModal('login')
      return
    }
    if (isInWishlist) removeFromWishlist(product.id)
    else addToWishlist(product.id)
  }

  const buyLabel = canBuy ? labels.buyNow : !isPriced ? labels.notAvailable : labels.outOfStock

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/9 bg-card p-4.5 lg:bg-[rgb(18_18_18/0.72)] lg:p-6 lg:backdrop-blur-[22px]">
      {price && (
        <div className="flex flex-col items-start gap-2">
          <ProductPrice price={price} compareAtPrice={compareAtPrice} discountPercent={discountPercent} />
          <PriceNotFinal label={labels.priceNotFinal} tip={labels.priceNotFinalTip} />
        </div>
      )}

      {cmsDropdownOptions.length > 0 && (
        <div
          className="relative z-20 grid gap-2.5"
          style={{ gridTemplateColumns: `repeat(${Math.min(cmsDropdownOptions.length, 3)}, minmax(0, 1fr))` }}
        >
          {cmsDropdownOptions.map((group) => {
            const selected = activeLabels[group.id] ?? group.options[0]?.label ?? ''
            const labelId = `cms-dropdown-${group.id}`
            // One option: nothing to choose, so it reads as a plain field without an arrow.
            if (group.options.length === 1) {
              return (
                <div key={group.id} className="min-w-0">
                  <div className="mb-1.5 truncate text-xs text-white/65">{group.groupName}</div>
                  <div className={FIELD_CLASS}>
                    <span className="truncate">{selected}</span>
                  </div>
                </div>
              )
            }
            const isOpen = openGroupId === group.id
            return (
              <div key={group.id} className="relative min-w-0">
                <div id={labelId} className="mb-1.5 truncate text-xs text-white/65">
                  {group.groupName}
                </div>
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={isOpen}
                  aria-labelledby={labelId}
                  onClick={() => setOpenGroupId(isOpen ? null : group.id)}
                  className={cn(
                    FIELD_CLASS,
                    'cursor-pointer transition-colors hover:border-white/22',
                    isOpen && 'border-white/30',
                  )}
                >
                  <span className="truncate">{selected}</span>
                  <ChevronDown className={cn('size-4.5 shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <div
                    role="listbox"
                    aria-labelledby={labelId}
                    className="animate-in fade-in zoom-in-95 bg-secondary border-border absolute top-full left-0 z-30 mt-2 w-full min-w-40 overflow-hidden rounded-[10px] border py-1 shadow-xl duration-100"
                  >
                    {group.options.map((option) => (
                      <div
                        key={option.id}
                        role="option"
                        tabIndex={0}
                        aria-selected={selected === option.label}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') selectOption(option.slug)
                        }}
                        onClick={() => selectOption(option.slug)}
                        className={cn(
                          'cursor-pointer px-3.5 py-2.5 text-sm text-white/95 transition-colors outline-none hover:bg-white/6 focus:bg-white/8',
                          selected === option.label && 'font-medium',
                        )}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <BuyNowButton
        id={PRODUCT_BUY_BUTTON_ID}
        label={buyLabel}
        disabled={!variant || !canBuy}
        busy={isOpening}
        onClick={buyNow}
      />
      <div className="flex gap-2.5">
        <AddToCartButton label={labels.addToCart} disabled={!variant || !canBuy} state={addState} onClick={addToCart} />
        <button
          type="button"
          onClick={toggleWishlist}
          disabled={isWishlistLoading}
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isInWishlist}
          className="inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-white/10 bg-white/6 text-white/95 transition-all duration-200 outline-none hover:-translate-y-px hover:border-white/20 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-60 [&_svg]:size-5"
        >
          <HeartIcon filled={isInWishlist} />
        </button>
      </div>
    </div>
  )
}
