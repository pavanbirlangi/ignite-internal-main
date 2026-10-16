'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Cookies from 'js-cookie'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUserStore } from '@/store/useUserStore'
import { AuthModal } from '@/components/auth'
import { LogoutDialog } from '@/components/auth/LogoutDialog'
import { UserAction } from './user-action'
import UserSolidIcon from '@/components/icons/UserSolidIcon'
import { cn } from '@/lib/utils'
import {
  Gamepad2,
  Heart,
  LifeBuoy,
  LogOut,
  ShoppingBag,
  UserRound,
} from 'lucide-react'
import { UserAvatar } from './UserAvatar'

const ACCOUNT_LINKS = [
  { href: '/dashboard/my-profile', label: 'My Profile', Icon: UserRound },
  { href: '/dashboard/my-library', label: 'My Library', Icon: Gamepad2 },
  { href: '/dashboard/my-orders', label: 'My Orders', Icon: ShoppingBag },
  { href: '/dashboard/wishlist', label: 'Wishlist', Icon: Heart },
  { href: '/dashboard/my-tickets', label: 'My Tickets', Icon: LifeBuoy },
]

const MENU_ITEM_CLASS =
  'cursor-pointer gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-white/85 transition-colors focus:bg-white/10 focus:text-white [&_svg]:size-4 [&_svg]:text-white/55 focus:[&_svg]:text-primary'

export function UserMenu() {
  const { isAuthenticated, user, isLoading, logout } = useUserStore()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) {
      return
    }

    const hasAccessToken = !!Cookies.get('access_token')
    if (!hasAccessToken && (isAuthenticated || user)) {
      logout()
    }
  }, [isClient, isAuthenticated, user, logout])

  const hasSessionToken = isClient && !!Cookies.get('access_token')
  const hasValidatedUser = hasSessionToken && isAuthenticated && !!user
  const isCheckingSession =
    hasSessionToken && isAuthenticated && !user && isLoading
  const displayName =
    user?.displayName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.email ||
    'My account'

  return (
    <>
      {isCheckingSession ? (
        <UserAction disabled className="cursor-wait opacity-70">
          <UserSolidIcon />
        </UserAction>
      ) : hasValidatedUser ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <UserAction className="hover:ring-primary/60 data-[state=open]:ring-primary/70 p-0.5 hover:ring-2 data-[state=open]:ring-2">
                <UserAvatar user={user} className="size-full text-sm" />
              </UserAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="bg-secondary/95 z-100 w-64 rounded-xl border-white/10 p-1.5 text-white shadow-2xl shadow-black/60 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 px-2.5 py-2.5">
                <UserAvatar user={user} className="size-10 text-sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {displayName}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-white/10" />
              {ACCOUNT_LINKS.map(({ href, label, Icon }) => (
                <DropdownMenuItem
                  key={href}
                  asChild
                  className={MENU_ITEM_CLASS}
                >
                  <Link href={href}>
                    <Icon />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className={cn(
                  MENU_ITEM_CLASS,
                  'text-red focus:bg-red/10 focus:text-red [&_svg]:text-red/80 focus:[&_svg]:text-red',
                )}
                onSelect={() => setLogoutDialogOpen(true)}
              >
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <LogoutDialog
            open={logoutDialogOpen}
            onOpenChange={setLogoutDialogOpen}
          />
        </>
      ) : (
        <AuthModal>
          <UserAction>
            <UserSolidIcon />
          </UserAction>
        </AuthModal>
      )}
    </>
  )
}
