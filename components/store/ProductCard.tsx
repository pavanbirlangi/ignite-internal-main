import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import HeartIcon from '../icons/HeartIcon'
import CartPlusIcon from '../icons/CartPlusIcon'
import Thunder from '../icons/Thunder'
import { getProxyImageUrl } from '@/lib/utils'
import { PlatformBadge } from './PlatformBadge'

import { useCartStore } from '@/store/useCartStore'
import { useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist'
import { useUserStore } from '@/store/useUserStore'
import { useAuthModalStore } from '@/store/useAuthModalStore'
import { toast } from 'sonner'
import { ProductListItem } from '@/types/product'
import { formatPrice } from '@/lib/currency'

interface ProductCardProps {
  product: ProductListItem
  wishlisted?: boolean
}

const StoreCard: React.FC<ProductCardProps> = ({ product, wishlisted }) => {
  const router = useRouter()
  const { addItem, isLoading: isCartLoading } = useCartStore()
  const { mutate: addToWishlist, isPending: isAdding } = useAddToWishlist()
  const { mutate: removeFromWishlist, isPending: isRemoving } =
    useRemoveFromWishlist()
  const { isAuthenticated } = useUserStore()
  const { openModal } = useAuthModalStore()

  const isWishlistLoading = isAdding || isRemoving
  const firstVariant = Array.isArray(product.variants)
    ? product.variants[0]
    : product.variants?.edges?.[0]?.node
  const gameLogoName = product.gameLogo?.name || product.platform?.[0] || product.title
  const variantId = firstVariant?.id
  const isInStock = firstVariant?.availableForSale ?? true

  const handleAddToCart = () => {
    if (!variantId) {
      toast.error('Variant unavailable for this product')
      return
    }

    if (!isInStock) {
      toast.error('This product is out of stock')
      return
    }

    addItem(variantId, 1)
  }

  const handleBuyNow = async () => {
    if (!variantId) {
      toast.error('Variant unavailable for this product')
      return
    }

    if (!isInStock) {
      toast.error('This product is out of stock')
      return
    }

 

    const { isAuthenticated: authed } = useUserStore.getState()
    if (!authed) {
      toast.info('Please log in to proceed with checkout', {
        duration: 2000,
        position: 'top-right',
      })
      openModal('login')
      return
    }
    await addItem(variantId, 1)

    // In-app checkout doesn't exist yet (Phase 11) -- Medusa carts have no
    // hosted checkout URL like Shopify's, so this routes to a placeholder.
    router.push('/checkout')
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      openModal('login')
      return
    }

    if (wishlisted) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product.id)
    }
  }
  const formatCurrency = formatPrice

  return (
    <div
      className="group glassmorphism bg-secondary/20 hover:border-border relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-transparent transition-all duration-100 hover:scale-[1.01] hover:shadow-2xl transform-gpu"
      style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
    >
      <Link
        href={`/${product.handle || product.id}`}
        className="flex h-full flex-col"
      >
        {/* Image Container */}
        <div
          className="relative aspect-[1/1.3] w-full overflow-hidden rounded-t-2xl transform-gpu"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <img
            src={getProxyImageUrl(
              product.featuredImageMeta?.url || product.featuredImage?.url || ''
            )}
            alt={
              product.featuredImageMeta?.altText ||
              product.featuredImage?.altText ||
              product.title ||
              ''
            }
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110`}
          />
          <div
            className="pointer-events-none absolute -inset-px bg-linear-to-t from-black/70 to-transparent transform-gpu"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          ></div>
          {wishlisted && (
            <button
              onClick={handleWishlistToggle}
              disabled={isWishlistLoading}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className="glassmorphism absolute top-3 right-3 z-10 flex size-8 cursor-pointer items-center justify-center rounded-full bg-(--wishlist-soft) transition-transform hover:scale-110 disabled:opacity-50"
            >
              <HeartIcon
                filled={wishlisted}
                className={`size-4 ${wishlisted ? 'animate-in zoom-in-50 duration-300' : 'text-white/70'}`}
              />
            </button>
          )}

          {/* Top-Left Badges (Out of Stock) */}
          {!isInStock && (
            <div className="absolute top-3 left-3 z-10">
              <div className="bg-red/90 flex items-center rounded-lg border border-white/10 px-2 py-1 shadow-lg backdrop-blur-md">
                <span className="text-[10px] leading-none font-bold tracking-wider text-white uppercase">
                  Out of Stock
                </span>
              </div>
            </div>
          )}

          {/* Icons & Discount Badge */}
          <div className="absolute right-3 bottom-3 left-3 z-10 flex items-end justify-between">
            <PlatformBadge platform={product.platform?.[0]} title={gameLogoName} />

            {/* Bottom-Right Badges (Discount) */}
            <div className="flex items-center gap-2">
              {product.discount &&
                product.compareAtPrice &&
                Number(
                  typeof product.compareAtPrice === 'object'
                    ? product.compareAtPrice.amount
                    : 0,
                ) > 0 && (
                  <div className="bg-red shadow-red/20 flex items-center rounded-lg px-2.5 py-1.5 shadow-xl">
                    <span className="text-xs leading-none font-medium text-white">
                      -{product.discount?.percentage}%
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="flex flex-1 flex-col p-3 transition-colors">
          <div className="flex flex-col gap-2">
            <h3 className="line-clamp-2 min-h-10 text-[12px] leading-5 font-semibold text-white/90 transition-colors group-hover:text-white">
              {product.title}
            </h3>

            {/* Price */}
            <div className="mt-2 flex flex-col gap-0.5 md:flex-row md:items-center md:gap-2">
              <span className="text-base leading-none font-bold tracking-tight text-white">
                {product.priceRange?.minVariantPrice?.amount
                  ? formatCurrency(
                    product.priceRange.minVariantPrice.amount,
                    product.priceRange.minVariantPrice.currencyCode,
                  )
                  : typeof product.price === 'object' && product.price
                    ? formatCurrency(
                      product.price.amount,
                      product.price.currencyCode,
                    )
                    : ((product.price as unknown as string) ?? '')}
              </span>
              {((product.originalPrice && product.originalPrice !== '0') ||
                (typeof product.compareAtPrice === 'object' &&
                  product.compareAtPrice?.amount &&
                  Number(product.compareAtPrice.amount) > 0)) && (
                  <span className="mt-2 text-[10px] leading-none font-medium tracking-tight text-white/40 line-through decoration-white/20 md:mt-0 md:text-[12px]">
                    {product.originalPrice ??
                      (typeof product.compareAtPrice === 'object' &&
                        formatCurrency(
                          product.compareAtPrice?.amount,
                          product.compareAtPrice?.currencyCode,
                        ))}
                  </span>
                )}
            </div>
          </div>
        </div>
      </Link>

      <div className="mt-1 rounded-b-2xl px-2 pt-0 pb-3 transition-colors">
        <div className="border-border group-hover:border-border mt-auto grid grid-cols-2 gap-2">
          {/* Add Button */}
          <button
            disabled={isCartLoading || !variantId || !isInStock}
            onClick={handleAddToCart}
            className="group/btn border-border flex w-full cursor-pointer items-center justify-center gap-1 rounded-[6px] border bg-transparent py-1.5 transition-all hover:border-white hover:bg-white/10 disabled:opacity-50"
          >
            <CartPlusIcon height={14} width={14} />
            <span className="text-[12px] font-semibold text-white transition-colors">
              Add
            </span>
          </button>

          {/* Buy Button */}
          <button
            disabled={isCartLoading || !variantId || !isInStock}
            onClick={handleBuyNow}
            className="bg-primary hover:bg-primary flex w-full cursor-pointer items-center justify-center gap-1 rounded-[6px] py-1.5 transition-all hover:shadow-[0_0_15px_var(--primary-glow)] disabled:opacity-50"
          >
            <Thunder height={14} width={14} />
            <span className="text-[12px] font-semibold text-white">Buy</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default StoreCard
