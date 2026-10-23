"use client"

import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ACCOUNT_CHIP_ROW_CLASS,
  ACCOUNT_MENU_PANEL_CLASS,
  ACCOUNT_SORT_TRIGGER_CLASS,
  accountChipClass,
  accountMenuItemClass,
} from "./account-ui"

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

// Platform / Type: the same button and menu as the Order Date sort, "Platform: All" on the button.
function FilterMenu({
  label,
  allLabel,
  options,
  value,
  onChange,
}: {
  label: string
  allLabel: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const choose = (next: string) => {
    onChange(next)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(ACCOUNT_SORT_TRIGGER_CLASS, "h-10 px-3.5", value && "border-white/30")}
      >
        <span className="text-white/65">{label}:</span>
        <span>{value || "All"}</span>
        <ChevronDown className={cn("size-4 text-white/65 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          {/* Clicking anywhere outside closes the menu */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div role="menu" className={cn(ACCOUNT_MENU_PANEL_CLASS, "right-auto left-0 max-h-72 w-56 overflow-y-auto")}>
            {["", ...options].map((option) => (
              <button
                key={option || "all"}
                type="button"
                role="menuitemradio"
                aria-checked={value === option}
                onClick={() => choose(option)}
                className={cn(accountMenuItemClass(value === option), "justify-between gap-3")}
              >
                <span className="truncate">{option || allLabel}</span>
                {value === option && <Check className="size-4 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

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

      {/* Sub-filters: platform and product type */}
      {(platforms.length > 0 || productTypes.length > 0) && (
        <div className="flex flex-wrap items-center gap-2.5">
          {platforms.length > 0 && onPlatformChange && (
            <FilterMenu
              label="Platform"
              allLabel="All platforms"
              options={platforms}
              value={activePlatform}
              onChange={onPlatformChange}
            />
          )}
          {productTypes.length > 0 && onProductTypeChange && (
            <FilterMenu
              label="Type"
              allLabel="All types"
              options={productTypes}
              value={activeProductType}
              onChange={onProductTypeChange}
            />
          )}
        </div>
      )}
    </div>
  )
}
