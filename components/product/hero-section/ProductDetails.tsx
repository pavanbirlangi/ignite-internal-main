'use client'

import { useState, useMemo } from 'react'
import { CheckCircle2, ChevronDown, Star, XCircle } from 'lucide-react'
import AddCartIcon from '@/components/icons/AddCartIcon'
import HeartIcon from '@/components/icons/HeartIcon'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/useCartStore'
import type { Product, ProductVariant } from '@/types/product'
import { ActivationGuideModal } from '@/components/shared/ActivationGuideModal'
import { toast } from 'sonner'
import { useUserStore } from '@/store/useUserStore'
import { useAuthModalStore } from '@/store/useAuthModalStore'
import {
  useWishlistStatus,
  useAddToWishlist,
  useRemoveFromWishlist,
} from '@/hooks/useWishlist'
import { formatPrice } from '@/lib/currency'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { CmsMappedDropdownGroup } from '@/lib/services/cms-product.service'

interface ProductDetailsProps {
  product: Product
  cmsDropdownOptions?: CmsMappedDropdownGroup[]
  locale?: string
  labels?: {
    instantDeliveryBadge?: string
    onSaleBadge?: string
    digitalKeyBadge?: string
    activationGuide?: string
    inStock?: string
    outOfStock?: string
    digitalDownload?: string
    buyNow?: string
  }
}

function renderStars(ratingValue?: string | null, scaleMax?: string | null) {
  const value = ratingValue ? parseFloat(ratingValue) : 0
  const max = scaleMax ? parseFloat(scaleMax) || 5 : 5
  const normalized = max > 0 ? Math.min(Math.max((value / max) * 5, 0), 5) : 0

  return Array.from({ length: 5 }, (_, i) => (
    <div key={i} className="relative h-[18px] w-[18px]">
      <Star size={18} className="text-muted-foreground absolute inset-0" />
      <div
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${Math.min(Math.max(normalized - i, 0), 1) * 100}%` }}
      >
        <Star size={18} fill="currentColor" className="text-accent" />
      </div>
    </div>
  ))
}

export default function ProductDetails({
  product,
  cmsDropdownOptions = [],
  locale,
  labels,
}: ProductDetailsProps) {
  const { addItem, loadCart, isLoading: isCartLoading } = useCartStore()
  const { isAuthenticated } = useUserStore()
  const { openModal } = useAuthModalStore()

  const { data: statusData, isLoading: isStatusLoading } = useWishlistStatus(
    product.id,
    isAuthenticated,
  )
  const { mutate: addToWishlist, isPending: isAdding } = useAddToWishlist()
  const { mutate: removeFromWishlist, isPending: isRemoving } =
    useRemoveFromWishlist()

  const isInWishlist = !!statusData?.isInWishlist
  const isWishlistLoading = isStatusLoading || isAdding || isRemoving
  const router = useRouter()

  const hasCmsDropdownOptions = cmsDropdownOptions.length > 0

  // Derive the currently selected label for each CMS dropdown group.
  // The active option is the one flagged isActive by the server (i.e. matches
  // the current slug), falling back to the first option in the group.
  const activeCmsDropdownValues = useMemo<Record<string, string>>(() => {
    return cmsDropdownOptions.reduce<Record<string, string>>((acc, group) => {
      const activeOption =
        group.options.find((option) => option.isActive) ?? group.options[0]
      if (activeOption) acc[group.id] = activeOption.label
      return acc
    }, {})
  }, [cmsDropdownOptions])

  const [openCmsDropdownId, setOpenCmsDropdownId] = useState<string | null>(
    null,
  )

  // Normalise variants to a flat array regardless of API shape
  const allVariants: ProductVariant[] = useMemo(() => {
    if (Array.isArray(product.variants)) {
      return product.variants
    }
    return product.variants.edges.map((e) => e.node)
  }, [product.variants])

  // Pick the first available variant. With CMS-driven dropdowns, variant
  // selection is handled via page navigation (each option links to a slug),
  // so we simply use the first available variant of the current product.
  const selectedVariant: ProductVariant | undefined = useMemo(() => {
    return (
      allVariants.find((v: ProductVariant) => v.availableForSale) ??
      allVariants[0]
    )
  }, [allVariants])

  const ratingValue = product.rating?.value
  const ratingScaleMax = product.rating?.scale_max

  // Uses the shared formatPrice from @/lib/currency (imported above)

  const displayPrice = selectedVariant
    ? formatPrice(
        selectedVariant.price.amount,
        selectedVariant.price.currencyCode,
      )
    : '—'

  const displayCompareAtPrice = selectedVariant?.compareAtPrice
    ? formatPrice(
        selectedVariant.compareAtPrice.amount,
        selectedVariant.compareAtPrice.currencyCode,
      )
    : null

  const displayDiscount = selectedVariant?.discount ?? null

  const handleAdd = () => {
    if (!selectedVariant) {
      toast.error('Please select an available variant')
      return
    }

    if (!isInStock) {
      toast.error('This product is out of stock')
      return
    }

    addItem(selectedVariant.id, 1)
  }

  const handleBuyNow = async () => {
    if (!selectedVariant) {
      toast.error('Please select an available variant')
      return
    }

    if (!isInStock) {
      toast.error('This product is out of stock')
      return
    }
    // const { isAuthenticated: authed } = useUserStore.getState()
    // if (!authed) {
    //   toast.info('Please log in to proceed with checkout', {
    //     duration: 2000,
    //     position: 'top-right',
    //   })
    //   openModal('login')
    //   return
    // }

    await addItem(selectedVariant.id, 1)
    router.push('/cart')

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

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      openModal('login')
      return
    }

    if (isInWishlist) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product.id)
    }
  }

  const isInStock = selectedVariant
    ? selectedVariant.availableForSale
    : product.inStock

  // Derive grid column class based on number of CMS dropdown groups (max 3)
  const cmsGridColsClass =
    cmsDropdownOptions.length === 1
      ? 'grid-cols-2'
      : cmsDropdownOptions.length === 2
        ? 'grid-cols-2'
        : 'grid-cols-3'

  const handleCmsOptionSelect = (slug: string) => {
    setOpenCmsDropdownId(null)

    if (!slug || slug === product.handle) {
      return
    }

    if (locale) {
      router.push(`/${locale}/${slug}`)
      return
    }

    router.push(`/${slug}`)
  }

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-visible rounded-2xl border border-white/5 bg-(--background-24) p-4 shadow-2xl backdrop-blur-3xl md:px-6 md:py-8">
      <div className="mb-4 flex w-full items-center justify-between">
        {/* Badges */}
        <div className="flex gap-2">
          {product.instantDelivery && (
            <span className="bg-primary shadow-primary/20 rounded px-2 py-1.5 text-[8px] font-bold text-white shadow-lg">
              {labels?.instantDeliveryBadge ?? 'INSTANT DELIVERY'}
            </span>
          )}
          {product.onSale && (
            <span className="bg-red shadow-red/20 rounded px-2 py-1.5 text-[8px] font-bold text-white shadow-lg">
              {labels?.onSaleBadge ?? 'ON SALE'}
            </span>
          )}
          {/* {product.tags && product.tags.length > 0 ? (
            product.tags.map((tag) => (
              <span
                key={tag}
                className="bg-primary shadow-primary/20 rounded px-2 py-1.5 text-[8px] font-bold text-white uppercase shadow-lg"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="bg-primary shadow-primary/20 rounded px-2 py-1.5 text-[8px] font-bold text-white shadow-lg">
              {labels?.digitalKeyBadge ?? 'DIGITAL KEY'}
            </span>
          )} */}
        </div>

        {/* Ratings */}
        {ratingValue && (
          <div className="flex items-center gap-1">
            {renderStars(ratingValue, ratingScaleMax)}
          </div>
        )}
      </div>

      {/* Title */}
      <h1 className="mb-2 text-[18px] font-semibold text-white">
        {product.title}
      </h1>

      {/* Pricing */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-[18px] font-bold text-white">{displayPrice}</span>
        {displayCompareAtPrice && (
          <span className="text-muted-foreground text-sm line-through">
            {displayCompareAtPrice}
          </span>
        )}
        {displayDiscount && (
          <span className="bg-red rounded px-2 py-0.5 text-xs font-bold text-white">
            -{displayDiscount.percentage}%
          </span>
        )}
      </div>

      {/* Dropdowns Container */}
      {hasCmsDropdownOptions && (
        <div className={`relative z-20 mb-4 grid gap-4 ${cmsGridColsClass}`}>
          {cmsDropdownOptions.map((group) => {
            const isOpen = openCmsDropdownId === group.id
            const selectedLabel =
              activeCmsDropdownValues[group.id] ?? group.options[0]?.label ?? ''
            const labelId = `cms-dropdown-${group.id}`

            return (
              <div key={group.id} className="relative">
                <button
                  type="button"
                  id={labelId}
                  aria-haspopup="listbox"
                  aria-expanded={isOpen}
                  aria-labelledby={labelId}
                  onClick={() => setOpenCmsDropdownId(isOpen ? null : group.id)}
                  className={`w-full border bg-(--background-20) ${
                    isOpen ? 'border-primary' : 'border-white/10'
                  } flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 transition-all duration-200 hover:border-white/20`}
                >
                  <span className="text-sm font-medium text-white">
                    {selectedLabel}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`text-white transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div
                    role="listbox"
                    aria-labelledby={labelId}
                    className="animate-in fade-in zoom-in-95 bg-secondary absolute top-full left-0 z-30 mt-2 w-full overflow-hidden rounded-lg border border-white/10 shadow-xl duration-100"
                  >
                    {group.options.map((option) => (
                      <div
                        key={option.id}
                        role="option"
                        tabIndex={0}
                        aria-selected={selectedLabel === option.label}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleCmsOptionSelect(option.slug)
                          }
                        }}
                        onClick={() => handleCmsOptionSelect(option.slug)}
                        className="cursor-pointer px-4 py-2.5 text-sm text-white transition-colors outline-none hover:bg-white/5 hover:text-white focus:bg-white/10"
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

      {/* Info Container (Activation Guide & Stock) */}
      <div className="mb-8 flex w-full flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-transparent p-4 md:flex-row">
        {/* Activation Guide Section -- each part renders only when it has
            real content. The three metadata fields behind this are filled
            independently in Admin, so a product can legitimately have a
            platform name with no icon, or neither. */}
        {product.activationGuide && (
          <div className="flex w-full items-center gap-3 md:w-auto">
            {product.activationGuide.icon && (
              <Image
                src={product.activationGuide.icon}
                alt={product.activationGuide.name || product.title}
                width={32}
                height={32}
                className="object-cover"
              />
            )}
            <div className="flex flex-col">
              {product.activationGuide.name && (
                <span className="mb-1 text-sm leading-none font-medium text-white">
                  {product.activationGuide.name}
                </span>
              )}
              <ActivationGuideModal
                title={product.activationGuide.name}
                guideHtml={product.activationGuide.guide}
              >
                <span className="text-primary cursor-pointer text-[10px] font-medium hover:underline">
                  {labels?.activationGuide ?? 'Activation Guide'}
                </span>
              </ActivationGuideModal>
            </div>
          </div>
        )}

        {/* Divider 1 */}
        <div className="hidden h-8 w-px bg-white/10 md:block"></div>

        {/* Stock Status */}
        <div className="flex w-full items-center gap-2 md:w-auto">
          {isInStock ? (
            <CheckCircle2
              size={18}
              className="text-destructive"
              fill="transparent"
              strokeWidth={2.5}
            />
          ) : (
            <XCircle
              size={18}
              className="text-red"
              fill="transparent"
              strokeWidth={2.5}
            />
          )}
          <span className="text-sm font-medium text-white">
            {isInStock
              ? (labels?.inStock ?? 'In Stock')
              : (labels?.outOfStock ?? 'Out of Stock')}
          </span>
        </div>

        {/* Divider 2 */}
        <div className="hidden h-8 w-px bg-white/10 md:block"></div>

        {/* Digital Download */}
        <div className="flex w-full items-center gap-2 md:w-auto">
          <CheckCircle2
            size={18}
            className="text-destructive"
            fill="transparent"
            strokeWidth={2.5}
          />
          <span className="text-sm">
            {labels?.digitalDownload ?? 'Digital Download'}
          </span>
        </div>
      </div>

      <div className="mt-auto flex gap-4">
        <Button
          icon={true}
          onClick={handleAddToWishlist}
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          disabled={isWishlistLoading}
        >
          <HeartIcon filled={isInWishlist} />
        </Button>
        <Button
          icon={true}
          disabled={isCartLoading || !selectedVariant || !isInStock}
          onClick={handleAdd}
          aria-label="Add to cart"
        >
          <AddCartIcon />
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          disabled={isCartLoading || !selectedVariant || !isInStock}
          onClick={handleBuyNow}
        >
          {labels?.buyNow ?? 'Buy Now'}
        </Button>
      </div>
    </div>
  )
}
