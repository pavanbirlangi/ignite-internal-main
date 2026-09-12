import React, { useState } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'
import { FilterOption } from '@/data/filterData'

interface FilterAccordionProps {
  title: string
  options: FilterOption[]
  selectedIds: string[]
  onToggle: (id: string) => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  hasSearch?: boolean
  onSearchChange?: (val: string) => void
}

const FilterAccordion: React.FC<FilterAccordionProps> = ({
  title,
  options,
  selectedIds,
  onToggle,
  isOpen,
  setIsOpen,
  hasSearch = false,
  onSearchChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    if (onSearchChange) {
      onSearchChange(val)
    }
  }

  const getIdString = (id: string | { name: string; count: number }) =>
    typeof id === 'string' ? id : id.name
  const getLabelString = (label: string | { name: string; count: number }) =>
    typeof label === 'string' ? label : label.name
  const getCount = (option: FilterOption) =>
    typeof option.id === 'object' ? option.id.count : option.count

  const filteredOptions = onSearchChange
    ? options
    : options.filter((option) =>
        getLabelString(option.label)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      )

  return (
    <div className="border-secondary box-border flex w-full flex-none grow-0 flex-col self-stretch border-b">
      <button
        className="flex h-11 w-full cursor-pointer flex-row items-center gap-10 p-[12px_20px]"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="flex h-5 w-full flex-none grow-0 flex-row items-center justify-between">
          <div className="flex h-2.75 flex-none grow-0 flex-row items-center justify-between">
            <span className="flex h-2.75 flex-none grow-0 items-center self-stretch text-[14px] leading-4.5 font-semibold text-white">
              {title}
            </span>
            {selectedIds.length > 0 && (
              <div className="bg-primary ml-2 inline-flex h-4 w-4 flex-none grow-0 items-center justify-center rounded-full text-center text-[11px] leading-none font-semibold text-white tabular-nums">
                <span className="inline-flex items-center justify-center leading-none">
                  {selectedIds.length}
                </span>
              </div>
            )}
          </div>
          <ChevronDown
            className={`size-5 flex-none grow-0 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      {isOpen && (
        <div className="flex flex-col gap-2 p-[0_20px_16px]">
          {hasSearch && (
            <div className="relative mb-2">
              <div className="bg-secondary flex w-full flex-col items-start gap-2.5 rounded-[6px] p-[9px_8px]">
                <div className="flex h-2 w-full flex-row items-center gap-2">
                  <Search className="text-muted-foregreound size-2.5 flex-none grow-0" />
                  <input
                    type="text"
                    placeholder="Search..."
                    onChange={handleSearchChange}
                    aria-label={`Search within ${title}`}
                    className="text-muted-foregreound placeholder-muted-foregreound h-3.25 w-full border-none bg-transparent text-[10px] leading-3.25 font-medium outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div
            className={`flex flex-col gap-2 ${hasSearch ? 'custom-scrollbar max-h-37.5 overflow-y-auto pr-1' : ''}`}
          >
            {filteredOptions.map((option) => {
              const idString = getIdString(option.id)
              const labelString = getLabelString(option.label)
              const idLower = idString.toLowerCase()
              const isSelected = selectedIds.some(
                (id) => id.toLowerCase() === idLower,
              )
              return (
                <label
                  key={idString}
                  className="group flex h-4 shrink-0 cursor-pointer items-center gap-1.5"
                >
                  <div
                    className={`flex size-4 items-center justify-center rounded-[2px] ${isSelected ? 'bg-primary' : 'bg-secondary group-hover:bg-border'}`}
                  >
                    {isSelected && (
                      <Check className="size-3 text-white" strokeWidth={3} />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isSelected}
                    onChange={() => onToggle(idString)}
                  />
                  <span
                    className={`text-[12px] leading-4 font-medium capitalize ${isSelected ? 'text-white' : 'text-muted-foreground'}`}
                  >
                    {labelString}
                  </span>
                  <span
                    className={`inline-flex items-center text-[10px] leading-none font-medium tabular-nums ${isSelected ? 'text-white' : 'text-muted-foreground'} `}
                  >
                    ({getCount(option)})
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterAccordion
