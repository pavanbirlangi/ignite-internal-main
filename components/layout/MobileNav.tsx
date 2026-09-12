'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { Home, Gamepad2, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import CartIcon from '../icons/CartIcon'
import { useCartStore } from '@/store/useCartStore'

export default function MobileNav() {
  const pathname = usePathname()
  const { cart } = useCartStore()

  const cartCount = useMemo(() => {
    if (!cart?.items?.length) return 0
    return cart.items.reduce((acc, item) => acc + (item.quantity || 0), 0)
  }, [cart])

  const navItems = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
      iconSize: 24,
    },
    {
      name: 'Store',
      href: '/store',
      icon: Gamepad2,
      iconSize: 24,
    },
    {
      name: 'Cart',
      href: '/cart',
      icon: CartIcon,
      iconSize: 24,
    },
    {
      name: 'Categories',
      href: '/categories',
      icon: LayoutGrid,
      iconSize: 24,
    },
  ]

  return (
    <div className="border-secondary bg-secondary fixed right-0 bottom-0 left-0 z-50 flex h-18 w-full items-start justify-center border-t md:hidden">
      <div className="flex w-full max-w-98.25 items-start justify-between px-4">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/' || pathname.match(/^\/[a-z]{2}$/) // matches / or /en
              : pathname.includes(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex h-18 w-18 flex-col items-center justify-center gap-1.5 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-white',
              )}
            >
              <div className="relative flex h-7 items-center justify-center">
                <Icon
                  width={item.iconSize}
                  height={item.iconSize}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(isActive && 'fill-primary/20')}
                />
                {item.name === 'Cart' && cartCount > 0 && (
                  <span className="bg-primary text-primary-foreground absolute -top-1 -right-2 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold">
                    {cartCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs leading-4',
                  isActive ? 'font-semibold' : 'font-medium',
                )}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
