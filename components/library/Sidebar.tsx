"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import ProfileIcon from "@/components/icons/dashboard/ProfileIcon"
import ControllerIcon from "@/components/icons/dashboard/ControllerIcon"
import WishlistIcon from "@/components/icons/dashboard/WishlistIcon"
import BagIcon from "@/components/icons/dashboard/BagIcon"
import SupportIcon from "@/components/icons/dashboard/SupportIcon"
import { cn } from "@/lib/utils"

const sidebarItems = [
  { label: "My Profile", icon: ProfileIcon, href: "/dashboard/my-profile" },
  { label: "My Library", icon: ControllerIcon, href: "/dashboard/my-library" },
  { label: "Wishlist", icon: WishlistIcon, href: "/dashboard/wishlist" },
  { label: "My Orders", icon: BagIcon, href: "/dashboard/my-orders" },
  { label: "My Tickets", icon: SupportIcon, href: "/dashboard/my-tickets" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-[220px] shrink-0 lg:flex lg:flex-col bg-secondary/20 border-r border-muted-foreground/10">
      <nav className="flex flex-col">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.includes(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-5 py-4 text-sm font-semibold transition-colors",
               
                isActive
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "size-5",
                isActive ? "text-white" : " text-muted-foreground group-hover:text-foreground"
              )} />
              <span className="text-[14px]">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}