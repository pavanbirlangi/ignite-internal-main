import React from 'react'

interface FilterHeaderProps {
  onClearAll: () => void
}

const FilterHeader: React.FC<FilterHeaderProps> = ({ onClearAll }) => {
  return (
    <div className="border-muted-foreground box-border flex h-15 w-full flex-none grow-0 flex-row items-center justify-between gap-22.5 self-stretch border-b-[0.5px] p-[24px_20px]">
      <span className="flex flex-none grow-0 items-center text-[16px] font-semibold text-white">
        Filters
      </span>
      <button
        onClick={onClearAll}
        className="text-muted-foreground flex flex-none grow-0 cursor-pointer items-center text-[12px] leading-4 font-semibold underline hover:text-white"
      >
        clear all
      </button>
    </div>
  )
}

export default FilterHeader
