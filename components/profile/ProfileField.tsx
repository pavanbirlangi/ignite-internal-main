import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ProfileFieldProps {
  label: string
  children: ReactNode
  action?: ReactNode
  className?: string
  // Editing: put the action under the input instead of beside it.
  stacked?: boolean
}

// One settings row: grey label over the value on the left, the action on the right.
export function ProfileField({
  label,
  children,
  action,
  className,
  stacked = false,
}: ProfileFieldProps) {
  return (
    <div
      className={cn(
        'border-border flex gap-4 border-t px-5 py-4 sm:gap-6',
        stacked ? 'flex-col sm:flex-row sm:items-center' : 'items-center',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs font-medium text-white/65">{label}</span>
        <div className="min-w-0 sm:max-w-md">{children}</div>
      </div>
      {action && <div className="flex shrink-0 items-center">{action}</div>}
    </div>
  )
}
