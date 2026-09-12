import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { NavItemProps } from '@/types/NavbarTypes'

export function NavItem({ children, className, href }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex cursor-pointer items-center justify-center gap-2 py-1 text-lg font-medium text-white transition-colors',
        'border-b-primary hover:border-b-primary border-y-4 border-y-transparent focus:ring-0 focus:outline-none',
        'active:text-primary',
        className,
      )}
    >
      {children}
    </Link>
  )
}
