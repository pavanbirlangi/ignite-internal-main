"use client"

import { ChevronDown, LogOut } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import ProfileIcon from "@/components/icons/dashboard/ProfileIcon"
import ControllerIcon from "@/components/icons/dashboard/ControllerIcon"
import WishlistIcon from "@/components/icons/dashboard/WishlistIcon"
import BagIcon from "@/components/icons/dashboard/BagIcon"
import SupportIcon from "@/components/icons/dashboard/SupportIcon"
import { LogoutDialog } from '../auth/LogoutDialog'

const sidebarItems = [
  { label: "My Profile", icon: ProfileIcon, href: "/dashboard/my-profile" },
  { label: "My Library", icon: ControllerIcon, href: "/dashboard/my-library" },
  { label: "Wishlist", icon: WishlistIcon, href: "/dashboard/wishlist" },
  { label: "My Orders", icon: BagIcon, href: "/dashboard/my-orders" },
  { label: "My Tickets", icon: SupportIcon, href: "/dashboard/my-tickets" },
]

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const pathname = usePathname()

  // Find the current active item based on the URL
  const activeItem = sidebarItems.find((item) =>  item.href === '/'
              ? pathname === '/' || pathname.match(/^\/[a-z]{2}$/) 
              : pathname.includes(item.href)) || sidebarItems[1]
  const ActiveIcon = activeItem.icon

  return (
    <div className="lg:hidden w-full py-6 relative">
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-[50px] w-full items-center justify-between rounded-[12px] bg-secondary px-5 text-[14px] font-semibold text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <ActiveIcon className="size-5" />
          {activeItem.label}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Overlay to close dropdown when clicking outside */}
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute left-0 right-0 z-50 mt-2 flex flex-col overflow-hidden rounded-[12px] border border-border bg-card shadow-lg">
            <nav className="flex flex-col">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                const Icon = item.icon
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-5 py-4 text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary/50"
                    )}
                  >
                    <Icon className={cn("size-5", isActive ? "text-white" : "")} />
                    <span className="text-[14px]">{item.label}</span>
                  </Link>
                )
              })}

              {/* Logout Button */}
              <button
                onClick={() => {
                  setIsOpen(false)
                  setLogoutDialogOpen(true)
                }}
                className={cn(
                  "flex items-center gap-3 px-5 py-4 text-sm font-semibold transition-colors text-red cursor-pointer"
                )}
              >
                <LogOut className="size-5" />
                <span className="text-[14px]">Logout</span>
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Logout Confirmation Dialog */}
      <LogoutDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen} />
    </div>
  )
}