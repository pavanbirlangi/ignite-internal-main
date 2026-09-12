'use client'

import { useState } from 'react'
import OS from '../icons/system/OS'
import Processor from '../icons/system/Processor'
import Memory from '../icons/system/Memory'
import Graphics from '../icons/system/Graphics'
import Storage from '../icons/system/Storage'
import type {
  Product,
  ProductSystemRequirementItem,
  ProductSystemRequirementDetail,
} from '@/types/product'
import type { CmsMappedSystemRequirement } from '@/lib/services/cms-product.service'

// Types for requirement items
interface RequirementItem {
  icon: React.ElementType
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
      items.push({ icon: OS, label: 'OS', value: details.os })
    }
    if (details.processor) {
      items.push({ icon: Processor, label: 'Processor', value: details.processor })
    }
    if (details.memory) {
      items.push({ icon: Memory, label: 'Memory', value: details.memory })
    }
    if (details.graphics) {
      items.push({ icon: Graphics, label: 'Graphics', value: details.graphics })
    }
    if (details.storage) {
      items.push({ icon: Storage, label: 'Storage', value: details.storage })
    }

    return items
  }

  const mapApiRequirements = (
    details: ProductSystemRequirementDetail | undefined,
  ): RequirementItem[] => {
    if (!details) return []

    const items: RequirementItem[] = []

    if (details.os) {
      items.push({ icon: OS, label: 'OS', value: details.os.name })
    }
    // Note: The new API structure has processors as an array
    if (details.processors && details.processors.length > 0) {
      items.push({
        icon: Processor,
        label: 'Processor',
        value: details.processors[0]._handle.replace(/-/g, ' '),
      })
    }
    // Note: The new API structure has graphics as an array
    if (details.graphics && details.graphics.length > 0) {
      items.push({
        icon: Graphics,
        label: 'Graphics',
        value: details.graphics[0].graphics_card,
      })
    }
    if (details.storage) {
      items.push({
        icon: Storage,
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

  return (
    <div className="max-w-container mx-auto mt-8 mb-16 w-full px-4 md:mt-12 md:mb-20 md:px-0">
      <h2 className="text-muted-foreground mb-6 text-lg font-semibold md:text-[20px]">
        {labels?.heading ?? 'System Requirements'}
      </h2>

      {/* Tabs */}
      <div className="mb-12 flex gap-2.5">
        {platforms.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`cursor-pointer rounded-[6px] border px-3 py-2 text-[14px] font-semibold transition-all duration-300 ${activeTab === tab
              ? 'border-primary text-primary bg-primary/5'
              : 'border-border text-white/40 hover:border-white/20 hover:text-white/60'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Minimum Section */}
      {minimumRequirements.length > 0 && (
        <div className="mb-12">
          <h3 className="text-muted-foreground mb-8 text-[16px] font-semibold">
            {labels?.minimum ?? 'Minimum System Requirements'}
          </h3>
          <div className="grid w-full grid-cols-1 justify-between gap-x-8 gap-y-8 sm:grid-cols-2 lg:flex">
            {minimumRequirements.map((req, index) => (
              <div key={index} className="flex flex-row items-start gap-4">
                <div className="mt-0.5 shrink-0">
                  <req.icon />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-[12px] font-semibold">
                    {req.label}
                  </span>
                  <span className="text-[14px] leading-snug font-medium text-white md:max-w-48">
                    {req.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Section */}
      {recommendedRequirements.length > 0 && (
        <div>
          <h3 className="text-muted-foreground mb-8 text-[16px] font-semibold">
            {labels?.recommended ?? 'Recommended System Requirements'}
          </h3>
          <div className="grid w-full grid-cols-1 justify-between gap-x-8 gap-y-8 sm:grid-cols-2 lg:flex">
            {recommendedRequirements.map((req, index) => (
              <div key={index} className="flex flex-row items-start gap-4">
                <div className="mt-0.5 shrink-0">
                  <req.icon />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-[12px] font-semibold">
                    {req.label}
                  </span>
                  <span className="text-[14px] leading-snug font-medium text-white md:max-w-48">
                    {req.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

