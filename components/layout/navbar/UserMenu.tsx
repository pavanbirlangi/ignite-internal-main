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
import UserIcon from '@/components/icons/UserIcon'

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

  return (
    <>
      {isCheckingSession ? (
        <UserAction disabled className="cursor-wait opacity-70">
          <UserIcon />
        </UserAction>
      ) : hasValidatedUser ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <UserAction>
                <UserIcon />
              </UserAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-border bg-card text-card-foreground z-100 w-48"
            >
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/my-profile"
                  className="w-full cursor-pointer font-semibold"
                >
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/my-library"
                  className="w-full cursor-pointer font-semibold"
                >
                  My Library
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/wishlist"
                  className="w-full cursor-pointer font-semibold"
                >
                  Wishlist
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/my-orders"
                  className="w-full cursor-pointer font-semibold"
                >
                  My Orders
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/my-tickets"
                  className="w-full cursor-pointer font-semibold"
                >
                  My Tickets
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="text-red focus:text-red focus:bg-red/10 cursor-pointer font-semibold"
                onSelect={() => setLogoutDialogOpen(true)}
              >
                Logout
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
            <UserIcon />
          </UserAction>
        </AuthModal>
      )}
    </>
  )
}
