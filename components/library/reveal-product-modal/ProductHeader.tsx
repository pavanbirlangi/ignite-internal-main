'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      {/* Product Image */}
      <div className="relative mx-auto h-[160px] w-[120px] shrink-0 overflow-hidden rounded-lg border border-white/10 shadow-lg md:mx-0">
        <Image
          src={getProxyImageUrl(product.imageUrl)}
          alt={product.title}
          fill
          className="object-cover"
        />
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <div className="flex items-start justify-between">
            <div className="flex max-w-96.5 flex-col gap-1">
              <h3 className="text-sm leading-tight font-semibold text-white sm:text-lg">
                {product.title}
              </h3>

              {/* Platforms */}
              {guideLoading ? (
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="bg-secondary h-4 w-4 animate-pulse rounded" />
                  <div className="bg-secondary h-3 w-20 animate-pulse rounded" />
                </div>
              ) : activationGuide ? (
                <div className="text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Image
                    src={getProxyImageUrl(activationGuide.icon)}
                    alt={activationGuide.name}
                    width={16}
                    height={16}
                    className="object-cover"
                  />
                  <span className="text-xs font-medium">
                    {activationGuide.name}
                  </span>
                </div>
              ) : product.platforms.length > 0 ? (
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  {product.platforms.map((platform) => {
                    const key = platform.toLowerCase()
                    const config = PLATFORM_MAP[key]

                    if (config) {
                      const IconComponent = config.icon
                      return (
                        <div
                          key={key}
                          className="text-muted-foreground flex items-center gap-1.5"
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
                        className="text-muted-foreground flex items-center gap-1.5"
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

            <Link href={`/${product.handle}`} className="shrink-0">
              <ExternalLink className="size-4 text-white hover:text-white/80" />
            </Link>
          </div>

          {/* Badges — categories + productType + tags */}
          {allBadges.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {allBadges.map((badge) => (
                <Badge
                  key={badge}
                  className="bg-primary hover:bg-primary/90 rounded-[6px] border-none px-2 py-1.5 text-[10px] font-semibold tracking-wider text-white uppercase"
                >
                  {badge}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
