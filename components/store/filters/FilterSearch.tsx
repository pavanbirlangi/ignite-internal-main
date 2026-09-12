import React from 'react'
import { Search } from 'lucide-react'

interface FilterSearchProps {
  value: string
  onChange: (value: string) => void
}

const FilterSearch: React.FC<FilterSearchProps> = ({ value, onChange }) => {
  return (
    <div className="border-secondary box-border flex h-20.75 w-full flex-none grow-0 flex-col items-start gap-10 self-stretch border-b p-[16px_20px]">
      <div className="flex h-12.75 w-full flex-none grow-0 flex-col items-start gap-3 self-stretch">
        <span className="flex h-2.75 w-full flex-none grow-0 items-center self-stretch text-[14px] leading-4.5 font-semibold text-white">
          Product Name
        </span>
        <div className="bg-secondary flex h-7 w-full flex-none grow-0 flex-col items-start gap-2.5 self-stretch rounded-[6px] p-[8px_6px]">
          <div className="flex h-3 w-full flex-none grow-0 flex-row items-center gap-2 self-stretch">
            <Search className="h-3 w-3 flex-none grow-0 text-white" />
            <input
              type="text"
              placeholder="Search for games & gift cards"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              aria-label="Search items by name"
              className="placeholder-muted-foreground h-4 w-full flex-none grow-0 border-none bg-transparent text-xs leading-4 font-medium text-white outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterSearch
