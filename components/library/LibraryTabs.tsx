"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

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
  const [isOpen, setIsOpen] = useState(false)

  // Construct tabs array with "All Products" at the beginning
  const tabs = [
    { title: "All Products", handle: "" },
    ...categories,
  ]

  const activeTabTarget = tabs.find(t => t.handle === activeCategory) || tabs[0]

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Categories Layer */}
      <div>
        {/* Mobile Category Dropdown */}
        <div className="relative md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-[50px] w-full items-center justify-between rounded-[12px] bg-secondary px-5 text-[14px] font-semibold text-foreground transition-colors"
          >
            {activeTabTarget.title}
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </button>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              <div className="absolute left-0 right-0 top-full z-20 mt-2 flex flex-col overflow-hidden rounded-[12px] border border-border bg-card shadow-lg max-h-[300px] overflow-y-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.handle || "all"}
                    onClick={() => {
                      onCategoryChange(tab.handle)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "flex h-[40px] shrink-0 items-center px-5 text-sm font-medium transition-colors hover:bg-secondary/50",
                      activeCategory === tab.handle ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )}
                  >
                    {tab.title}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Desktop Category Tabs */}
        <div className="hidden md:flex w-full overflow-x-auto scrollbar-hide pb-2">
          <div className="flex gap-3">
            {tabs.map((tab) => {
              const isActive = activeCategory === tab.handle
              return (
                <button
                  key={tab.handle || "all"}
                  onClick={() => onCategoryChange(tab.handle)}
                  className={cn(
                    "h-[36px] whitespace-nowrap rounded-[12px] cursor-pointer px-5 text-[16px] font-semibold transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  {tab.title}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sub-filters Layer (Platforms & Product Types) */}
      {(platforms.length > 0 || productTypes.length > 0) && (
        <div className="flex flex-wrap gap-4 items-center">
          {platforms.length > 0 && onPlatformChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">Platform:</span>
              <select
                value={activePlatform}
                onChange={(e) => onPlatformChange(e.target.value)}
                className="bg-secondary text-sm border-none rounded-md px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none"
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
              <span className="text-sm text-muted-foreground font-medium">Type:</span>
              <select
                value={activeProductType}
                onChange={(e) => onProductTypeChange(e.target.value)}
                className="bg-secondary text-sm border-none rounded-md px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none"
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
