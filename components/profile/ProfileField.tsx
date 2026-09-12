import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ProfileFieldProps {
  label: string
  children: ReactNode
  action?: ReactNode
  className?: string
}

export function ProfileField({
  label,
  children,
  action,
  className,
}: ProfileFieldProps) {
  return (
    <div
      className={cn(
        'border-muted-foreground flex flex-col gap-2 border-b pb-6 last:border-none',
        className,
      )}
    >
      <label className="text-muted-foreground text-xs font-semibold">
        {label}
      </label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-md">{children}</div>
        {action && <div className="w-full sm:ml-auto sm:w-auto">{action}</div>}
      </div>
    </div>
  )
}
