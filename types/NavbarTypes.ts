import type { ComponentProps, ReactNode } from 'react'

export interface NavItemProps extends Pick<
  ComponentProps<'a'>,
  | 'ref'
  | 'onMouseEnter'
  | 'onFocus'
  | 'onBlur'
  | 'style'
  | 'tabIndex'
  | 'aria-hidden'
> {
  children: ReactNode
  className?: string
  href: string
  // The gliding capsule is on this item (hovered or keyboard-focused).
  highlighted?: boolean
  // This item's platform is the page being shown.
  current?: boolean
}

export type UserActionProps = ComponentProps<'button'>
