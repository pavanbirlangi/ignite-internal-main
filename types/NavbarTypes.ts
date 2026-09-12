import type { ComponentProps, ReactNode } from 'react'

export interface NavItemProps {
  children: ReactNode
  className?: string
  href: string
}

export type UserActionProps = ComponentProps<'button'>
