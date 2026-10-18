import Image from 'next/image'
import { ChevronRight, Globe, Monitor, Star, Tag, Zap } from 'lucide-react'
import { ActivationGuideModal } from '@/components/shared/ActivationGuideModal'
import type { Product } from '@/types/product'
import type { CmsMappedDropdownGroup } from '@/lib/services/cms-product.service'
import { getProxyImageUrl } from '@/lib/utils'

export const PRODUCT_CONTAINER_CLASS = 'max-w-container mx-auto w-full px-4 xl:px-0'

const CHIP_CLASS =
  'inline-flex h-7.5 items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap backdrop-blur-md [&>svg]:size-3.5'
const LINK_CLASS =
  'group/link inline-flex items-center gap-1 text-sm font-medium text-[#7DB0FF] transition-colors hover:text-[#A9C9FF]'

// Two-letter values come from admin in any case ("Pc"); show them as the abbreviation they are.
const formatWorksOn = (values: string[]) =>
  values.map((value) => (value.length <= 2 ? value.toUpperCase() : value)).join(', ')

interface ProductHeroProps {
  product: Product
  coverImage: string
  coverAlt: string
  backgroundImage: string
  cmsDropdownOptions?: CmsMappedDropdownGroup[]
  hasSystemRequirements: boolean
  buyPanel: React.ReactNode
  labels: {
    instantDeliveryBadge: string
    onSaleBadge: string
    reviewCountOne: string
    reviewCount: string
    activationGuide: string
    systemRequirements: string
  }
}

// The top of the product page: the product's background art fills the hero, with the cover,
// admin badges, title and one line of facts on the left and the buy panel on the right.
export default function ProductHero({
  product,
  coverImage,
  coverAlt,
  backgroundImage,
  cmsDropdownOptions = [],
  hasSystemRequirements,
  buyPanel,
  labels,
}: ProductHeroProps) {
  // A fact already shown as a one-option variant field in the buy panel isn't repeated here.
  const shownInPanel = new Set(
    cmsDropdownOptions
      .filter((group) => group.options.length === 1)
      .map((group) => group.options[0].label.toLowerCase()),
  )
  const isNew = (value?: string) => Boolean(value) && !shownInPanel.has(value!.toLowerCase())

  const platform = product.platform[0] || product.activationGuide?.name
  const region = product.region?.length ? product.region.join(', ') : undefined
  const worksOn = product.worksOn?.length ? formatWorksOn(product.worksOn) : undefined
  const ratingValue = product.rating ? Number.parseFloat(product.rating.value) : 0
  const ratingCount = product.ratingCount ?? 0
  const guide = product.activationGuide

  return (
    <section className="relative">
      {/* Reaches up behind the sticky header (96px on phones, 120px from md), like the old hero. */}
      <div className="absolute inset-x-0 -top-24 h-[426px] overflow-hidden md:-top-30 md:h-[450px] lg:h-[calc(100%+7.5rem)]">
        <Image
          src={getProxyImageUrl(backgroundImage)}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(rgb(12_12_12/0.5),transparent_30%,rgb(12_12_12/0.6)_70%,var(--background))] lg:bg-[linear-gradient(90deg,rgb(12_12_12/0.94)_0%,rgb(12_12_12/0.72)_38%,rgb(12_12_12/0.2)_70%,rgb(12_12_12/0.35)_100%),linear-gradient(rgb(12_12_12/0.5),transparent_25%,transparent_55%,var(--background))]"
        />
      </div>

      <div
        className={`${PRODUCT_CONTAINER_CLASS} relative grid gap-5 pt-50 lg:min-h-170 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end lg:gap-14 lg:pt-36 lg:pb-14`}
      >
        <div className="grid grid-cols-[104px_minmax(0,1fr)] items-center gap-x-4 gap-y-3.5 [grid-template-areas:'top_top'_'cover_title'_'meta_meta'] lg:grid-cols-[150px_minmax(0,1fr)] lg:grid-rows-[1fr_auto_auto] lg:items-end lg:gap-x-7 lg:[grid-template-areas:'cover_top'_'cover_title'_'cover_meta']">
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-[0_30px_60px_-20px_rgb(0_0_0/0.8)] ring-1 ring-white/10 [grid-area:cover]">
            <Image
              src={getProxyImageUrl(coverImage)}
              alt={coverAlt}
              fill
              priority
              sizes="(min-width: 1024px) 150px, 104px"
              className="object-cover object-top"
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 self-end [grid-area:top]">
            {(product.instantDelivery || product.onSale) && (
              <div className="flex flex-wrap gap-2">
                {product.instantDelivery && (
                  <span className={`${CHIP_CLASS} border-white/10 bg-white/5 text-white/95`}>
                    <Zap className="text-[#5B9BFF]" />
                    {labels.instantDeliveryBadge}
                  </span>
                )}
                {product.onSale && (
                  <span className={`${CHIP_CLASS} border-deal/45 bg-white/5 text-[#FF7A92]`}>
                    <Tag />
                    {labels.onSaleBadge}
                  </span>
                )}
              </div>
            )}
            {product.rating && ratingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm text-white/65">
                <Star className="text-accent size-4" fill="currentColor" />
                <span className="font-medium text-white/95">{ratingValue.toFixed(1)}</span>
                <a href="#reviews" className="hover:text-white/95 hover:underline hover:underline-offset-3">
                  {ratingCount === 1
                    ? labels.reviewCountOne
                    : labels.reviewCount.replace('{count}', String(ratingCount))}
                </a>
              </span>
            )}
          </div>

          <h1 className="text-2xl leading-[30px] font-bold tracking-[-0.3px] text-white/95 [grid-area:title] lg:text-balance lg:text-[32px] lg:leading-[38px]">
            {product.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/95 [grid-area:meta]">
            {isNew(platform) && (
              <span className="inline-flex items-center gap-2">
                {guide?.icon && (
                  <Image src={guide.icon} alt="" width={18} height={18} className="size-4.5 object-contain" />
                )}
                {platform}
              </span>
            )}
            {isNew(region) && (
              <span className="inline-flex items-center gap-2">
                <Globe className="size-4 text-white/65" />
                {region}
              </span>
            )}
            {isNew(worksOn) && (
              <span className="inline-flex items-center gap-2">
                <Monitor className="size-4 text-white/65" />
                {worksOn}
              </span>
            )}
            {guide && (guide.guide || guide.link) && (
              <ActivationGuideModal title={guide.name} guideHtml={guide.guide} guideLink={guide.link}>
                <button type="button" className={`${LINK_CLASS} cursor-pointer`}>
                  {labels.activationGuide}
                  <ChevronRight className="size-3.5 transition-transform group-hover/link:translate-x-0.5" />
                </button>
              </ActivationGuideModal>
            )}
            {hasSystemRequirements && (
              <a href="#system-requirements" className={LINK_CLASS}>
                {labels.systemRequirements}
                <ChevronRight className="size-3.5 transition-transform group-hover/link:translate-x-0.5" />
              </a>
            )}
          </div>
        </div>

        <div>{buyPanel}</div>
      </div>
    </section>
  )
}
