import ProfileIcon from '@/components/icons/dashboard/ProfileIcon'
import ControllerIcon from '@/components/icons/dashboard/ControllerIcon'
import WishlistIcon from '@/components/icons/dashboard/WishlistIcon'
import BagIcon from '@/components/icons/dashboard/BagIcon'
import SupportIcon from '@/components/icons/dashboard/SupportIcon'
import type { User } from '@/store/useUserStore'

// The account pages, shared by the desktop sidebar and the phone dropdown.
export const ACCOUNT_NAV_ITEMS = [
  { label: 'My Profile', icon: ProfileIcon, href: '/dashboard/my-profile' },
  { label: 'My Library', icon: ControllerIcon, href: '/dashboard/my-library' },
  { label: 'Wishlist', icon: WishlistIcon, href: '/dashboard/wishlist' },
  { label: 'My Orders', icon: BagIcon, href: '/dashboard/my-orders' },
  { label: 'My Tickets', icon: SupportIcon, href: '/dashboard/my-tickets' },
]

export function isAccountNavActive(pathname: string, href: string) {
  // includes() so locale-prefixed paths (/fr/dashboard/...) and detail pages still match.
  return pathname.includes(href)
}

export function accountDisplayName(user: User) {
  return (
    user.displayName?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.email ||
    'My account'
  )
}
