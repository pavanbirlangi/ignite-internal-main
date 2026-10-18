'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { Product } from '@/types/product'
import { useProductPurchase } from '@/hooks/useProductPurchase'
import { PRODUCT_BUY_BUTTON_ID } from '@/components/product/hero-section/ProductDetails'
import { BuyNowButton } from '@/components/product/purchase-ui'
import { cn, getProxyImageUrl } from '@/lib/utils'

interface ProductBuyBarProps {
  product: Product
  coverImage: string
  labels: { buyNow: string; outOfStock: string; notAvailable: string }
}

// Slides up from the bottom (above the phone nav) once the buy panel's Buy now button has
// scrolled off the top, so price and Buy now stay in reach on a long page.
export default function ProductBuyBar({ product, coverImage, labels }: ProductBuyBarProps) {
  const { variant, isPriced, canBuy, price, compareAtPrice, buyNow, isOpening } = useProductPurchase(product)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const target = document.getElementById(PRODUCT_BUY_BUTTON_ID)
    if (!target) return
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  const facts = [product.platform[0], product.region?.[0]].filter(Boolean).join(' · ')
  const buyLabel = canBuy ? labels.buyNow : !isPriced ? labels.notAvailable : labels.outOfStock

  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={cn(
        'fixed inset-x-0 bottom-18 z-40 border-t border-white/8 bg-[rgb(14_14_14/0.9)] backdrop-blur-[18px] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none md:bottom-0',
        visible ? 'translate-y-0' : 'pointer-events-none translate-y-[calc(100%+4.5rem)] md:translate-y-full',
      )}
    >
      <div className="max-w-container mx-auto flex h-19 w-full items-center gap-4 px-4 xl:px-0">
        <div className="relative hidden aspect-[3/4] w-10 shrink-0 overflow-hidden rounded-md md:block">
          <Image src={getProxyImageUrl(coverImage)} alt="" fill sizes="40px" className="object-cover object-top" />
        </div>
        <div className="hidden min-w-0 flex-1 md:block">
          <p className="truncate text-base font-medium text-white/95">{product.title}</p>
          {facts && <p className="truncate text-xs text-white/65">{facts}</p>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col md:flex-none md:flex-row md:items-baseline md:gap-2">
          {price && <span className="text-lg leading-6 font-bold whitespace-nowrap text-white/95 md:text-xl">{price}</span>}
          {compareAtPrice && <span className="text-xs whitespace-nowrap text-white/45 line-through md:text-sm">{compareAtPrice}</span>}
        </div>
        <BuyNowButton
          label={buyLabel}
          disabled={!variant || !canBuy}
          busy={isOpening}
          onClick={buyNow}
          className="h-11 w-auto shrink-0 px-5 text-sm md:h-11.5 md:w-50 md:text-[15px]"
        />
      </div>
    </div>
  )
}
