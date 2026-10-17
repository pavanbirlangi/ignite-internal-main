"use client"

import { useState } from "react"
import { ACCOUNT_CHIP_ROW_CLASS, accountChipClass } from "@/components/library/account-ui"

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

  const activeTab = controlledTab ?? internalTab
  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalTab(tab)
    }
  }

  return (
    <div className={ACCOUNT_CHIP_ROW_CLASS}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => handleTabChange(tab)}
          className={accountChipClass(activeTab === tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
