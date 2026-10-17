'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import OS from '../../icons/system/OS'
import XboxIcon from '../../icons/XboxIcon'
import { ProductDetails } from './types'
import { getProxyImageUrl } from '@/lib/utils'

/** Maps a normalised platform key to its icon and display label. */
const PLATFORM_MAP: Record<
  string,
  { icon: React.FC<{ className?: string }>; label: string }
> = {
  windows: { icon: OS, label: 'Windows' },
  xbox: { icon: XboxIcon, label: 'Xbox' },
}

interface ProductHeaderProps {
  product: ProductDetails
  activationGuide?: { name: string; icon?: string | null }
  guideLoading?: boolean
}

export const ProductHeader = ({
  product,
  activationGuide,
  guideLoading,
}: ProductHeaderProps) => {
  /** Use displayTags from the library response. */
  const allBadges = product.displayTags || []

  return (
    <div className="flex items-center gap-4">
      {/* Product Image */}
      <div className="bg-secondary relative h-20 w-15 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={getProxyImageUrl(product.imageUrl)}
          alt={product.title}
          fill
          sizes="60px"
          className="object-cover"
        />
      </div>

      {/* Product Details */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h3 className="text-base font-bold text-white/95">
                {product.title}
              </h3>

              {/* Platforms */}
              {guideLoading ? (
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="bg-secondary size-4 animate-pulse rounded" />
                  <div className="bg-secondary h-3 w-20 animate-pulse rounded" />
                </div>
              ) : activationGuide ? (
                <div className="mt-0.5 flex items-center gap-1.5 text-white/65">
                  {/* Guarded: the icon is an independently-filled admin field,
                      and getProxyImageUrl returns '' for a missing one, which
                      next/image rejects at runtime with an empty-src error. */}
                  {activationGuide.icon && (
                    <Image
                      src={getProxyImageUrl(activationGuide.icon)}
                      alt={activationGuide.name}
                      width={16}
                      height={16}
                      className="object-cover"
                    />
                  )}
                  <span className="text-xs font-medium">
                    {activationGuide.name}
                  </span>
                </div>
              ) : product.platforms.length > 0 ? (
                <div className="mt-0.5 flex flex-wrap items-center gap-3">
                  {product.platforms.map((platform) => {
                    const key = platform.toLowerCase()
                    const config = PLATFORM_MAP[key]

                    if (config) {
                      const IconComponent = config.icon
                      return (
                        <div
                          key={key}
                          className="text-white/65 flex items-center gap-1.5"
                        >
                          <IconComponent className="h-4 w-4 fill-current" />
                          <span className="text-xs font-medium">
                            {config.label}
                          </span>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={key}
                        className="text-white/65 flex items-center gap-1.5"
                      >
                        <span className="text-xs font-medium capitalize">
                          {platform}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>

            <Link
              href={`/${product.handle}`}
              aria-label="Open product page"
              title="Open product page"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-white/5 text-white/65 transition-colors outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <ExternalLink className="size-4" />
            </Link>
          </div>

          {/* Badges — categories + productType + tags */}
          {allBadges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {allBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-md bg-white/8 px-2 py-1 text-xs font-medium text-white/65"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
