import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { NavItemProps } from '@/types/NavbarTypes'

// One platform link in the header pill. The highlight behind it is drawn by PlatformNav's gliding
// capsule; this only brightens the label and lifts the icon while it's the capsule's target. No
// z-index: coming after the capsule keeps it on top, and the expanding search bar must cover it.
export function NavItem({
  children,
  className,
  href,
  ref,
  highlighted,
  current,
  ...handlers
}: NavItemProps) {
  return (
    <Link
      ref={ref}
      href={href}
      aria-current={current ? 'page' : undefined}
      data-highlighted={highlighted || undefined}
      className={cn(
        'group/nav relative flex h-12 cursor-pointer items-center justify-center gap-2.5 rounded-full px-4 text-base font-medium',
        'text-white/65 transition-[color,transform] duration-200 ease-out focus:outline-none active:scale-95',
        'aria-[current=page]:text-white data-highlighted:text-white',
        '[&>div]:transition-transform [&>div]:duration-300 [&>div]:ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        'data-highlighted:[&>div]:-translate-y-0.5 data-highlighted:[&>div]:scale-110',
        'motion-reduce:transition-none motion-reduce:[&>div]:transition-none',
        className,
      )}
      {...handlers}
    >
      {children}
    </Link>
  )
}
