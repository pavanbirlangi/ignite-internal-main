import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import type { UserActionProps } from '@/types/NavbarTypes'

export const UserAction = forwardRef<HTMLButtonElement, UserActionProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label="User menu"
        className={cn(
          'text-muted-foreground relative size-8 transition-colors hover:bg-white/10 rounded-full focus:ring-0 focus:outline-none',
          className,
        )}
        {...props}
      />
    )
  },
)

UserAction.displayName = 'UserAction'
