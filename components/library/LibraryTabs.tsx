"use client"

import { ACCOUNT_CHIP_ROW_CLASS, accountChipClass } from "./account-ui"

export interface LibraryItemCategory {
  title: string
  handle: string
}

interface LibraryTabsProps {
  categories?: LibraryItemCategory[]
  activeCategory: string
  onCategoryChange: (categoryHandle: string) => void

  platforms?: string[]
  activePlatform?: string
  onPlatformChange?: (platform: string) => void

  productTypes?: string[]
  activeProductType?: string
  onProductTypeChange?: (productType: string) => void
}

const SELECT_CLASS =
  "bg-secondary border-border h-9 cursor-pointer rounded-lg border px-3 text-sm font-medium text-white/95 outline-none transition-colors hover:border-white/20 focus-visible:border-primary/70"

export function LibraryTabs({
  categories = [],
  activeCategory,
  onCategoryChange,
  platforms = [],
  activePlatform = "",
  onPlatformChange,
  productTypes = [],
  activeProductType = "",
  onProductTypeChange
}: LibraryTabsProps) {
  // Construct tabs array with "All Products" at the beginning
  const tabs = [
    { title: "All Products", handle: "" },
    ...categories,
  ]

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Categories: one swipeable chip row on every width */}
      <div className={ACCOUNT_CHIP_ROW_CLASS}>
        {tabs.map((tab) => (
          <button
            key={tab.handle || "all"}
            type="button"
            onClick={() => onCategoryChange(tab.handle)}
            className={accountChipClass(activeCategory === tab.handle)}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* Sub-filters Layer (Platforms & Product Types) */}
      {(platforms.length > 0 || productTypes.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {platforms.length > 0 && onPlatformChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/65">Platform:</span>
              <select
                value={activePlatform}
                onChange={(e) => onPlatformChange(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">All Platforms</option>
                {platforms.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}

          {productTypes.length > 0 && onProductTypeChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/65">Type:</span>
              <select
                value={activeProductType}
                onChange={(e) => onProductTypeChange(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">All Types</option>
                {productTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
