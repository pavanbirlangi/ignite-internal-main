'use client'

import { useState } from 'react'
import type {
  Product,
  ProductSystemRequirementDetail,
} from '@/types/product'
import type { CmsMappedSystemRequirement } from '@/lib/services/cms-product.service'
import { PRODUCT_CONTAINER_CLASS } from '@/components/product/hero-section/ProductHero'

// Types for requirement items
interface RequirementItem {
  label: string
  value: string
}

interface SystemRequirementsProps {
  product: Product
  cmsSystemRequirements?: CmsMappedSystemRequirement[]
  labels?: {
    heading?: string
    minimum?: string
    recommended?: string
  }
}



export default function SystemRequirements({
  product,
  cmsSystemRequirements,
  labels,
}: SystemRequirementsProps) {
  // Determine whether to use CMS data or Shopify data
  const useCms =
    cmsSystemRequirements && cmsSystemRequirements.length > 0

  const platforms = useCms
    ? cmsSystemRequirements.map(
      (req) => req.platform.charAt(0).toUpperCase() + req.platform.slice(1),
    )
    : product.systemRequirements?.map((req) => req.platform.name) || []

  const [activeTab, setActiveTab] = useState(
    platforms.length > 0 ? platforms[0] : 'Windows',
  )

  if (platforms.length === 0) {
    return null
  }

  /** Map CMS requirement details to RequirementItem[] */
  const mapCmsRequirements = (
    details: CmsMappedSystemRequirement['minimum'] | CmsMappedSystemRequirement['recommended'],
  ): RequirementItem[] => {
    if (!details) return []

    const items: RequirementItem[] = []

    if (details.os) {
      items.push({ label: 'OS', value: details.os })
    }
    if (details.processor) {
      items.push({ label: 'Processor', value: details.processor })
    }
    if (details.memory) {
      items.push({ label: 'Memory', value: details.memory })
    }
    if (details.graphics) {
      items.push({ label: 'Graphics', value: details.graphics })
    }
    if (details.storage) {
      items.push({ label: 'Storage', value: details.storage })
    }

    return items
  }

  const mapApiRequirements = (
    details: ProductSystemRequirementDetail | undefined,
  ): RequirementItem[] => {
    if (!details) return []

    const items: RequirementItem[] = []

    if (details.os) {
      items.push({ label: 'OS', value: details.os.name })
    }
    // Note: The new API structure has processors as an array
    if (details.processors && details.processors.length > 0) {
      items.push({
        label: 'Processor',
        value: details.processors[0]._handle.replace(/-/g, ' '),
      })
    }
    // Note: The new API structure has graphics as an array
    if (details.graphics && details.graphics.length > 0) {
      items.push({
        label: 'Graphics',
        value: details.graphics[0].graphics_card,
      })
    }
    if (details.storage) {
      items.push({
        label: 'Storage',
        value: details.storage.storage,
      })
    }

    return items
  }

  let minimumRequirements: RequirementItem[] = []
  let recommendedRequirements: RequirementItem[] = []

  if (useCms) {
    const activeCms = cmsSystemRequirements.find(
      (req) =>
        req.platform.charAt(0).toUpperCase() + req.platform.slice(1) ===
        activeTab,
    )
    minimumRequirements = mapCmsRequirements(activeCms?.minimum ?? null)
    recommendedRequirements = mapCmsRequirements(
      activeCms?.recommended ?? null,
    )
  } else {
    const activeRequirements = product.systemRequirements?.find(
      (req) => req.platform.name === activeTab,
    )
    minimumRequirements = mapApiRequirements(activeRequirements?.minimum)
    recommendedRequirements = mapApiRequirements(
      activeRequirements?.recommended,
    )
  }

  const column = (title: string, items: RequirementItem[]) =>
    items.length > 0 && (
      <div className="bg-card border-border rounded-[14px] border px-5 pt-1.5 pb-2">
        <h3 className="pt-3.5 pb-1.5 text-xs font-medium tracking-[0.6px] text-white/65 uppercase">{title}</h3>
        <dl>
          {items.map((req) => (
            <div
              key={req.label}
              className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 border-t border-white/7 py-3 text-sm leading-5 first:border-t-0 sm:grid-cols-[110px_minmax(0,1fr)]"
            >
              <dt className="text-white/65">{req.label}</dt>
              <dd className="text-white/95">{req.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    )

  return (
    <section id="system-requirements" className={`${PRODUCT_CONTAINER_CLASS} scroll-mt-28`}>
      <h2 className="mb-5 text-xl leading-[26px] font-bold text-white/95 md:text-2xl md:leading-[30px]">
        {labels?.heading ?? 'System requirements'}
      </h2>

      {/* Platform pills: a choice only when there is more than one platform. */}
      <div className="mb-4 flex flex-wrap gap-2">
        {platforms.map((tab) =>
          platforms.length > 1 ? (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={`inline-flex h-8 cursor-pointer items-center rounded-full px-3.5 text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-white text-[#111]' : 'bg-white/6 text-white/65 hover:bg-white/10 hover:text-white/95'
              }`}
            >
              {tab}
            </button>
          ) : (
            <span key={tab} className="inline-flex h-8 items-center rounded-full bg-white px-3.5 text-sm font-medium text-[#111]">
              {tab}
            </span>
          ),
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {column(labels?.minimum ?? 'Minimum', minimumRequirements)}
        {column(labels?.recommended ?? 'Recommended', recommendedRequirements)}
      </div>
    </section>
  )
}

