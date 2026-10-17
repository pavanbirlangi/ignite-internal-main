"use client"

import { ChevronDown, LogOut } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LogoutDialog } from '../auth/LogoutDialog'
import { ACCOUNT_NAV_ITEMS, isAccountNavActive } from "./account-nav"
import { ACCOUNT_NAV_ACTIVE_CLASS, ACCOUNT_NAV_LINK_CLASS, AccountIdentity } from "./Sidebar"

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const pathname = usePathname()

  const activeItem =
    ACCOUNT_NAV_ITEMS.find((item) => isAccountNavActive(pathname, item.href)) || ACCOUNT_NAV_ITEMS[1]
  const ActiveIcon = activeItem.icon

  return (
    <div className="relative w-full lg:hidden">
      <AccountIdentity className="pb-3" />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="bg-card border-border flex h-12 w-full cursor-pointer items-center justify-between rounded-xl border px-4 text-sm font-medium text-white/95 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <span className="flex items-center gap-2.5">
          <ActiveIcon className="size-5" />
          {activeItem.label}
        </span>
        <ChevronDown className={cn("size-4 text-white/65 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          {/* Clicking anywhere outside closes the menu */}
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsOpen(false)}
          />

          <nav className="bg-card border-border absolute right-0 left-0 z-50 mt-2 flex flex-col gap-0.5 rounded-xl border p-1 shadow-lg">
            {ACCOUNT_NAV_ITEMS.map((item) => {
              const isActive = isAccountNavActive(pathname, item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(ACCOUNT_NAV_LINK_CLASS, isActive && ACCOUNT_NAV_ACTIVE_CLASS)}
                >
                  <Icon className="size-5 shrink-0" />
                  {item.label}
                </Link>
              )
            })}

            <div className="border-border mt-1 border-t pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setLogoutDialogOpen(true)
                }}
                className={ACCOUNT_NAV_LINK_CLASS}
              >
                <LogOut className="size-5 shrink-0" />
                Log out
              </button>
            </div>
          </nav>
        </>
      )}

      <LogoutDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen} />
    </div>
  )
}
