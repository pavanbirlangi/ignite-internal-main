"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

const tabs = [
  "All Orders",
  "Paid",
  "Pending",
  "Refunded",
  "Fulfilled",
  "Unfulfilled",
  "Partial",
]

interface OrderTabsProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function OrderTabs({ activeTab: controlledTab, onTabChange }: OrderTabsProps) {
  const [internalTab, setInternalTab] = useState("All Orders")
  const [isOpen, setIsOpen] = useState(false)

  const activeTab = controlledTab ?? internalTab
  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalTab(tab)
    }
  }

  return (
    <div className="w-full">
      {/* Mobile Dropdown */}
      <div className="relative md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-[50px] w-full items-center justify-between rounded-[12px] bg-secondary px-5 text-[14px] font-semibold text-foreground transition-colors"
        >
          {activeTab}
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-10 mt-2 flex flex-col overflow-hidden rounded-[12px] border border-border bg-card shadow-lg">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  handleTabChange(tab)
                  setIsOpen(false)
                }}
                className={cn(
                  "flex h-[40px] items-center px-5 text-sm font-medium transition-colors hover:bg-secondary/50",
                  activeTab === tab ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Tabs */}
      <div className="hidden md:flex w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "h-[36px] whitespace-nowrap rounded-[12px] cursor-pointer px-5 text-[16px] font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
