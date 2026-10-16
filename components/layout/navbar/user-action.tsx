import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import type { UserActionProps } from '@/types/NavbarTypes'
import { headerIconButtonClass } from './header-icon-button'

export const UserAction = forwardRef<HTMLButtonElement, UserActionProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label="User menu"
        className={cn(headerIconButtonClass, className)}
        {...props}
      />
    )
  },
)

UserAction.displayName = 'UserAction'
