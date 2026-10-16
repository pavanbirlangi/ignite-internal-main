import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import HeartIcon from '../icons/HeartIcon'
import CartPlusIcon from '../icons/CartPlusIcon'
import Thunder from '../icons/Thunder'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { getProxyImageUrl } from '@/lib/utils'
import { prepareCartFlight } from '@/lib/fly-to-cart'

import { useCartStore } from '@/store/useCartStore'
import { useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist'
import { useUserStore } from '@/store/useUserStore'
import { useAuthModalStore } from '@/store/useAuthModalStore'
import { toast } from 'sonner'
import { ProductListItem } from '@/types/product'
import { formatPrice } from '@/lib/currency'
import { useRouter } from 'next/navigation'

type ButtonState = 'idle' | 'loading' | 'done'

// Keeps a quick request from flashing the spinner for a single frame.
const MIN_SPINNER_MS = 450
// How long the Add button shows "Added" before returning to normal.
const DONE_MS = 1400

const trackPointer = (e: React.PointerEvent<HTMLElement>) => {
  const rect = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--pointer-x', `${e.clientX - rect.left}px`)
  e.currentTarget.style.setProperty('--pointer-y', `${e.clientY - rect.top}px`)
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const FACE =
  'col-start-1 row-start-1 flex items-center justify-center gap-1.5 transition-[opacity,transform,filter] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'
const FACE_HIDDEN = 'pointer-events-none opacity-0 blur-[2px]'
// Hover: the icon springs (the cart tips back, the bolt zaps).
const ICON_HOVER = {
  tip: 'transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-enabled/btn:group-hover/btn:-translate-x-0.5 group-enabled/btn:group-hover/btn:-rotate-12 group-enabled/btn:group-hover/btn:scale-112',
  zap: 'group-enabled/btn:group-hover/btn:animate-icon-zap',
}

// The button's normal, loading and done faces, stacked in one grid cell so
// the button never changes size, cross-fading between them.
// Loading: the label slides away and a ring turns round the icon.
// Done: a tick draws itself in.
const ButtonFace = ({
  state,
  icon,
  iconHover,
  label,
  doneLabel,
}: {
  state: ButtonState
  icon: React.ReactNode
  iconHover: keyof typeof ICON_HOVER
  label: string
  doneLabel: string
}) => (
  <span className="grid place-items-center">
    <span
      className={cn(
        FACE,
        state !== 'idle' && cn(FACE_HIDDEN, '-translate-y-2.5'),
      )}
    >
      <span className={cn('flex motion-reduce:transform-none', ICON_HOVER[iconHover])}>
        {icon}
      </span>
      {/* .trim drops the font's built-in space under the letters, so the
          word centres against the icon instead of riding high. */}
      <span className="trim">{label}</span>
    </span>
    <span
      className={cn(
        FACE,
        // Paused while hidden, so idle cards don't keep spinning off-screen.
        state !== 'loading' &&
          cn(FACE_HIDDEN, 'scale-60 [&_*]:[animation-play-state:paused]'),
      )}
    >
      <span className="relative grid size-6 place-items-center">
        <Spinner className="absolute inset-0" />
        <span className="animate-icon-breathe flex [&>svg]:size-3">{icon}</span>
      </span>
    </span>
    <span
      className={cn(
        FACE,
        state !== 'done' && cn(FACE_HIDDEN, 'translate-y-2.5'),
      )}
    >
      {state === 'done' ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="size-[15px]"
        >
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            pathLength={1}
            strokeDasharray={1}
            className="animate-check-draw"
          />
        </svg>
      ) : (
        <span className="size-[15px]" />
      )}
      <span className="trim">{doneLabel}</span>
    </span>
  </span>
)

// Hover also gets a soft light under the pointer (.pointer-light in globals.css).
const BUTTON =
  'pointer-light group/btn relative isolate grid h-9 w-full cursor-pointer place-items-center overflow-hidden rounded-lg text-[13px] font-semibold text-white transition-[transform,background-color,border-color,box-shadow,filter,opacity] duration-300 enabled:hover:-translate-y-px enabled:active:scale-[0.97] disabled:cursor-default motion-reduce:transition-none'

interface ProductCardProps {
  product: ProductListItem
  wishlisted?: boolean
}

const StoreCard: React.FC<ProductCardProps> = ({ product, wishlisted }) => {
  const { addItem, loadCart } = useCartStore()
  // Per card, so clicking one product's button doesn't disable every other
  // card on the page (the cart store's isLoading is shared by all of them).
  const [addState, setAddState] = useState<ButtonState>('idle')
  const [buyState, setBuyState] = useState<ButtonState>('idle')
  const isBusy = addState !== 'idle' || buyState !== 'idle'
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const coverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (doneTimer.current) clearTimeout(doneTimer.current)
    }
  }, [])
  const { mutate: addToWishlist, isPending: isAdding } = useAddToWishlist()
  const { mutate: removeFromWishlist, isPending: isRemoving } =
    useRemoveFromWishlist()
  const { isAuthenticated } = useUserStore()
  const { openModal } = useAuthModalStore()

  const isWishlistLoading = isAdding || isRemoving
  const firstVariant = Array.isArray(product.variants)
    ? product.variants[0]
    : product.variants?.edges?.[0]?.node
  const gameLogoIcon = product.gameLogo?.icon
  const gameLogoName = product.gameLogo?.name || product.title
  const variantId = firstVariant?.id
  const isInStock = firstVariant?.availableForSale ?? true
  const router = useRouter()

  const handleAddToCart = async () => {
    if (!variantId) {
      toast.error('Variant unavailable for this product')
      return
    }

    if (!isInStock) {
      toast.error('This product is out of stock')
      return
    }

    setAddState('loading')
    const flight = prepareCartFlight()
    const addedBefore = useCartStore.getState().itemsAdded
    await Promise.all([addItem(variantId, 1), wait(MIN_SPINNER_MS)])

    // addItem reports failures with its own toast, so only a real add
    // gets the "Added" confirmation and the cover flying to the cart.
    if (useCartStore.getState().itemsAdded > addedBefore) {
      setAddState('done')
      flight.launch(coverRef.current?.querySelector('img') ?? null)
      doneTimer.current = setTimeout(() => setAddState('idle'), DONE_MS)
    } else {
      flight.cancel()
      setAddState('idle')
    }
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
    // if (!authed) {
    //   toast.info('Please log in to proceed with checkout', {
    //     duration: 2000,
    //     position: 'top-right',
    //   })
    //   openModal('login')
    //   return
    // }

    setBuyState('loading')
    const addedBefore = useCartStore.getState().itemsAdded
    await Promise.all([addItem(variantId, 1), wait(MIN_SPINNER_MS)])
    setBuyState(
      useCartStore.getState().itemsAdded > addedBefore ? 'done' : 'idle',
    )
    router.push('/cart')
    // Stays spinning while the cart page loads; reset in case the user stays.
    doneTimer.current = setTimeout(() => setBuyState('idle'), 4000)
    // let checkoutUrl = useCartStore.getState().cart?.checkoutUrl
    // if (!checkoutUrl) {
    //   await loadCart()
    //   checkoutUrl = useCartStore.getState().cart?.checkoutUrl
    // }

    // if (checkoutUrl) {
    //   window.location.href = checkoutUrl
    //   return
    // }

    // toast.error('Checkout is currently unavailable. Please try again.')
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
      // Hover: the cover slowly zooms and one band of light sweeps across it
      // (the same sweep as the hero's Browse Deals button).
      // The border needs ! to beat .glassmorphism, which sits outside Tailwind's layers.
      className="group glassmorphism bg-secondary/20 relative flex h-full w-full transform-gpu flex-col overflow-hidden rounded-2xl transition-[border-color] duration-[450ms] hover:border-white/20! motion-reduce:transition-none"
      style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
    >
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
      <Link
        href={`/${product.handle || product.id}`}
        className="flex h-full flex-col"
      >
        {/* Image Container */}
        <div
          ref={coverRef}
          className="relative aspect-[1/1.3] w-full overflow-hidden rounded-t-2xl transform-gpu"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <Image
            src={getProxyImageUrl(
              product.featuredImageMeta?.url || product.featuredImage?.url || ''
            )}
            alt={
              product.featuredImageMeta?.altText ||
              product.featuredImage?.altText ||
              product.title ||
              ''
            }
            fill
            loading="lazy"
            sizes="(max-width: 640px) 58vw, (max-width: 768px) 38vw, (max-width: 1024px) 32vw, 20vw"
            className="object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 motion-reduce:transition-none"
            style={{ objectFit: 'cover', objectPosition: 'top' }}
          />
          <span
            aria-hidden
            className="group-hover:animate-card-glare pointer-events-none absolute inset-y-[-10%] -left-[60%] z-[3] w-[38%] -skew-x-[20deg] bg-linear-to-r from-transparent via-white/30 to-transparent opacity-0 motion-reduce:hidden"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/90 to-transparent transform-gpu"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          ></div>

          {/* Top-Left Badges (Out of Stock) */}
          {!isInStock && (
            <div className="absolute top-3 left-3 z-10">
              {/* Same size and shape as the discount badge. .trim drops the
                  font's built-in space under the letters so they sit centred. */}
              <div className="bg-deal flex h-[22px] items-center rounded-[6px] px-[9px]">
                <span className="trim block text-[11px] font-bold tracking-[0.06em] text-white uppercase">
                  Out of Stock
                </span>
              </div>
            </div>
          )}

          {/* Centred so the discount lines up with the platform icon. */}
          <div className="absolute bottom-3 z-10 flex h-8 w-full items-center justify-between px-3">
            {/* Icons & Discount Badge */}
            <div className="flex items-end justify-between">
              {gameLogoIcon ? (
                <div className="flex h-8 w-8 items-center justify-center">
                  <Image
                    src={gameLogoIcon}
                    alt={gameLogoName}
                    width={18}
                    height={18}
                    className="object-contain"
                  />
                </div>
              ) : null}
            </div>

            {/* Bottom-Right Badges (Discount) */}
            <div className="flex items-center gap-2">
              {product.discount &&
                product.compareAtPrice &&
                Number(
                  typeof product.compareAtPrice === 'object'
                    ? product.compareAtPrice.amount
                    : 0,
                ) > 0 && (
                  <div className="bg-deal flex h-[22px] items-center rounded-[6px] px-2">
                    <span className="trim block text-[13px] font-bold tracking-[0.01em] text-white">
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
            <h3 className="line-clamp-2 min-h-10 text-sm leading-5 font-semibold text-white/90 transition-colors group-hover:text-white">
              {product.title}
            </h3>

            {/* Price */}
            <div className="mt-2 flex flex-col gap-0.5 md:flex-row md:items-center md:gap-2">
              <span className="text-[19px] leading-none font-bold tracking-tight text-white">
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
                <span className="mt-2 text-[13px] leading-none font-medium tracking-tight text-white/40 line-through decoration-white/20 md:mt-0">
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
            disabled={isBusy || !variantId || !isInStock}
            onClick={handleAddToCart}
            onPointerMove={trackPointer}
            aria-label={`Add ${product.title} to cart`}
            aria-busy={addState === 'loading'}
            className={cn(
              BUTTON,
              // Its edge also lights up near the pointer.
              'pointer-rim border-border border bg-white/[0.02] enabled:hover:border-white/30 enabled:hover:bg-white/[0.07]',
              // The button showing progress stays fully lit; only the
              // other one dims.
              addState === 'idle' && 'disabled:opacity-50',
            )}
          >
            <ButtonFace
              state={addState}
              icon={<CartPlusIcon height={15} width={15} />}
              iconHover="tip"
              label="Add"
              doneLabel="Added"
            />
          </button>

          {/* Buy Button */}
          <button
            disabled={isBusy || !variantId || !isInStock}
            onClick={handleBuyNow}
            onPointerMove={trackPointer}
            aria-label={`Buy ${product.title} now`}
            aria-busy={buyState === 'loading'}
            className={cn(
              BUTTON,
              'bg-primary enabled:hover:shadow-[0_10px_24px_-10px_var(--primary)] enabled:hover:brightness-110',
              buyState === 'idle' && 'disabled:opacity-50',
            )}
          >
            <ButtonFace
              state={buyState}
              icon={<Thunder height={15} width={15} />}
              iconHover="zap"
              label="Buy"
              doneLabel="Opening cart"
            />
          </button>
        </div>
      </div>
    </div>
  )
}

export default StoreCard
