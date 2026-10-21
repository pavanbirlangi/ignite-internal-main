import { Ban } from 'lucide-react'
import { cn } from '@/lib/utils'

const SIZE_CLASS = {
  lg: 'h-13 gap-2.5 px-4 text-[15px] [&>svg]:size-4.5',
  md: 'h-11 gap-2 px-3.5 text-sm [&>svg]:size-4',
  sm: 'h-9 gap-1.5 px-3 text-[13px] [&>svg]:size-3.5',
} as const

// Takes the place of the buy buttons when a product can't be bought: a red status with a left
// accent, shaped like an alert rather than a button, so nobody tries to click it.
export function SoldOutStatus({
  label,
  size = 'lg',
  id,
  className,
}: {
  label: string
  size?: keyof typeof SIZE_CLASS
  id?: string
  className?: string
}) {
  return (
    <div
      id={id}
      role="status"
      className={cn(
        'border-deal flex w-full items-center rounded-l-md rounded-r-[10px] border-l-[3px] bg-linear-to-r from-[rgb(229_25_63/0.16)] to-[rgb(229_25_63/0.04)] font-medium whitespace-nowrap text-[#FF7088] select-none',
        SIZE_CLASS[size],
        className,
      )}
    >
      <Ban aria-hidden />
      {label}
    </div>
  )
}
