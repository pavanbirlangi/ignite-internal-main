"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUserStore } from "@/store/useUserStore"
import { UserAvatar } from "@/components/layout/navbar/UserAvatar"
import { LogoutDialog } from "@/components/auth/LogoutDialog"
import { ACCOUNT_NAV_ITEMS, accountDisplayName, isAccountNavActive } from "./account-nav"

export const ACCOUNT_NAV_LINK_CLASS =
  "relative flex h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3.5 text-sm font-medium text-white/65 transition-colors outline-none hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"

// Active page: soft panel, white label, short blue marker on the left edge.
export const ACCOUNT_NAV_ACTIVE_CLASS =
  "bg-white/6 text-white before:bg-primary before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-full"

// Avatar, name and email at the top of the account menu.
export function AccountIdentity({ className }: { className?: string }) {
  const user = useUserStore((state) => state.user)

  if (!user) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <span className="bg-secondary size-11 shrink-0 animate-pulse rounded-full" />
        <span className="bg-secondary h-4 w-32 animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <UserAvatar user={user} className="size-11 text-sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{accountDisplayName(user)}</p>
        <p className="truncate text-xs text-white/65">{user.email}</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  return (
    // Stays in view while the page scrolls: 112px = the scrolled header (88px) + 24px gap.
    <aside className="hidden w-60 shrink-0 lg:sticky lg:top-28 lg:block">
      <AccountIdentity className="px-1 pb-5" />
      <nav className="flex flex-col gap-0.5">
        {ACCOUNT_NAV_ITEMS.map((item) => {
          const isActive = isAccountNavActive(pathname, item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(ACCOUNT_NAV_LINK_CLASS, isActive && ACCOUNT_NAV_ACTIVE_CLASS)}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
        <div className="border-border mt-3 border-t pt-3">
          <button
            type="button"
            onClick={() => setLogoutDialogOpen(true)}
            className={ACCOUNT_NAV_LINK_CLASS}
          >
            <LogOut className="size-5 shrink-0" />
            Log out
          </button>
        </div>
      </nav>
      <LogoutDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen} />
    </aside>
  )
}
