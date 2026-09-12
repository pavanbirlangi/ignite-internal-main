'use client'

import React from 'react'
import { ChevronDown, X } from 'lucide-react'
import { SortOption, FilterOption } from '../../types/store/types'

interface FilterBarProps {
  sortBy: SortOption
  onSortChange: (option: SortOption) => void
  activeFilters: FilterOption[]
  onRemoveFilter: (id: string) => void
  onClearAll: () => void
}

const FilterBar: React.FC<FilterBarProps> = ({
  sortBy,
  onSortChange,
  activeFilters,
  onRemoveFilter,
  onClearAll,
}) => {
  return (
    <div className="flex w-full flex-col gap-5">
      {/* Sorting Tabs (Custom Design) */}
      <div className="border-muted-foreground flex h-10 w-full items-center gap-4 overflow-hidden border-b-[0.5px] lg:gap-8">
        <span className="shrink-0 text-[14px] leading-5.25 font-semibold text-white lg:text-[16px]">
          Sort by:
        </span>

        <div className="flex h-full w-full snap-x items-center gap-5 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] lg:gap-8 [&::-webkit-scrollbar]:hidden">
          {[
            { label: 'Price - Low to High', value: 'price-low-high' },
            { label: 'Price - High to Low', value: 'price-high-low' },
            { label: 'Newest First', value: 'newest' },
            { label: 'Popularity', value: 'popularity' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value as SortOption)}
              className={`relative flex h-full shrink-0 cursor-pointer snap-start items-center justify-center px-2 text-[14px] font-semibold whitespace-nowrap transition-all lg:text-[16px] ${sortBy === option.value
                  ? 'border-primary border-b-2 text-white'
                  : 'text-muted-foreground hover:text-white'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters */}
      <div className="flex items-center gap-6 overflow-hidden">
        <div className="flex items-center gap-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {activeFilters.map((filter) => (
            <div
              key={filter.id}
              className="bg-secondary flex h-6 shrink-0 items-center justify-center gap-0.75 rounded-[6px] px-2.5 py-1"
            >
              <span className="capitalize text-[12px] leading-4 font-semibold text-white">
                {filter.label}
              </span>
              <button
                onClick={() => onRemoveFilter(filter.id)}
                aria-label={`Remove ${filter.label} filter`}
                className="text-muted-foreground cursor-pointer hover:text-white"
              >
                <X size={'16px'} />
              </button>
            </div>
          ))}
        </div>

        {activeFilters.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-muted-foreground cursor-pointer text-nowrap text-[12px] leading-4 font-semibold underline hover:text-white"
          >
            clear all
          </button>
        )}
      </div>
    </div>
  )
}

export default FilterBar
