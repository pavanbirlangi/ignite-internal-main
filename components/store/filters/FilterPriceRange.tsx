import React from 'react'
import { getCurrencyDisplay } from '@/lib/currency'

interface FilterPriceRangeProps {
  min: string
  max: string
  currencyCode?: string
  onMinChange: (value: string) => void
  onMaxChange: (value: string) => void
}

const FilterPriceRange: React.FC<FilterPriceRangeProps> = ({
  min,
  max,
  currencyCode,
  onMinChange,
  onMaxChange,
}) => {
  const currencyDisplay = getCurrencyDisplay(currencyCode)

  return (
    <div className="border-secondary box-border flex w-full flex-col items-start gap-5 border-b p-[16px_20px]">
      <span className="text-[14px] leading-4.5 font-semibold text-white">
        Price Range ({currencyDisplay})
      </span>

      <div className="flex w-full items-center gap-2.5">
        <div className="bg-secondary focus-within:ring-primary hover:bg-border flex h-6.75 flex-1 items-center rounded-[6px] px-1.5 py-2.25 transition-colors focus-within:ring-1">
          <input
            type="number"
            min={0}
            value={min}
            onChange={(e) => onMinChange(e.target.value)}
            className="placeholder-muted-foreground flex w-full items-center-safe border-none bg-transparent text-[12px] font-medium text-white outline-none"
            placeholder="Min"
            aria-label="Minimum price"
          />
        </div>
        <span className="text-muted-foreground font-bold">-</span>
        <div className="bg-secondary focus-within:ring-primary hover:bg-border flex h-6.75 flex-1 items-center rounded-[6px] px-1.5 py-2.25 transition-colors focus-within:ring-1">
          <input
            type="number"
            value={max}
            min={0}
            onChange={(e) => onMaxChange(e.target.value)}
            className="placeholder-muted-foreground flex w-full items-center-safe border-none bg-transparent text-[12px] font-medium text-white outline-none"
            placeholder="Max"
            aria-label="Maximum price"
          />
        </div>
      </div>
    </div>
  )
}

export default FilterPriceRange
