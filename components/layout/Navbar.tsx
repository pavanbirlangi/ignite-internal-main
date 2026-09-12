'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import PCIcon from '../icons/PCIcon'
import XboxIcon from '../icons/XboxIcon'
import PlayStationIcon from '../icons/PlayStationIcon'
import NintendoIcon from '../icons/NintendoIcon'
import SearchIcon from '../icons/SearchIcon'
import XIcon from '../icons/XIcon'
import UserIcon from '../icons/UserIcon'
import { MenuIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  buildProductRoute,
  buildStoreSearchRoute,
} from '@/lib/search/search-utils'
import { CartDrawer } from '../cart/CartDrawer'
import { AuthModal } from '../auth'
import { useUserStore } from '@/store/useUserStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogoutDialog } from '../auth/LogoutDialog'
import { useDebounce } from '@/hooks/useDebounce'
import { useProducts } from '@/hooks/useProducts'
import type { ProductListItem } from '@/types/product'
import SearchSuggestions from '../home/SearchSuggestions'
import { MobileSidebar } from './MobileSidebar'
import { MobileSearch } from './MobileSearch'
import { NavItem } from './navbar/nav-item'
import { UserMenu } from './navbar/UserMenu'
import type { NavbarData } from '@/lib/services/navbar.service'

export default function Navbar({
  navbarData,
}: {
  navbarData?: NavbarData | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)
  const { isAuthenticated, user, fetchUser } = useUserStore()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const debouncedQuery = useDebounce(inputValue.trim(), 300)
  const shouldFetch = debouncedQuery.length >= 2

  const { data, isLoading } = useProducts(
    { query: debouncedQuery, first: 5 },
    shouldFetch,
  )

  const suggestions = data?.products ?? []
  const suggestionsOpen = searchOpen && shouldFetch

  useEffect(() => {
    setIsClient(true)

    const handleScroll = () => {
      setIsScrolled((prev) => {
        const scrollY = window.scrollY
        const enterThreshold = 64
        const exitThreshold = 8

        if (prev) {
          return scrollY > exitThreshold
        }

        return scrollY > enterThreshold
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchUser()
    }
  }, [isAuthenticated, user, fetchUser])

  const hasToken = isClient && isAuthenticated

  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = 'hidden'
      searchRef.current?.focus()
      searchRef.current?.select()
    } else {
      document.body.style.overflow = 'unset'
      // Reset input when closing
      setInputValue('')
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [searchOpen])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navigateToStore = useCallback(
    (q: string) => {
      setSearchOpen(false)
      setInputValue('')
      router.push(buildStoreSearchRoute(q))
    },
    [router],
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') navigateToStore(inputValue)
    if (e.key === 'Escape') setSearchOpen(false)
  }

  const handleSelectProduct = (product: ProductListItem) => {
    setSearchOpen(false)
    setInputValue('')
    router.push(buildProductRoute(product))
  }

  if (pathname?.includes('/cart')) {
    return null
  }

  return (
    <>
      <nav
        className={cn(
          'sticky top-0 z-50 transition-all duration-200 ease-in-out select-none',
          isScrolled
            ? 'bg-(--secondary-20) py-3 shadow-xl backdrop-blur-3xl'
            : 'bg-transparent pt-4 pb-4 md:pt-10',
        )}
      >
        <div
          className={cn(
            'from-background to-background/0 absolute inset-0 -z-1 bg-linear-to-b',
            !isScrolled ? 'opacity-100' : 'opacity-0',
          )}
        />

        <div className="container flex h-16 justify-between gap-2 [--max-width-container:1240px]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="group flex size-8 shrink-0 items-center justify-center rounded-full transition-all hover:bg-white/10 hover:text-white focus:outline-none active:scale-90 lg:hidden"
              aria-label="Open Mobile Menu"
            >
              <MenuIcon className="size-6 transition-transform group-hover:scale-110" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center">
              <Image
                src={
                  navbarData?.logo
                    ? `${process.env.NEXT_PUBLIC_CMS_API_URL}/assets/${navbarData.logo}`
                    : '/images/common/logo.svg'
                }
                alt="Logo"
                width={100}
                height={100}
                className="h-4 sm:h-5 w-auto"
                quality={100}
                unoptimized
              />
            </Link>
          </div>
          {/* Central Search / Platform Bar */}
          <div
            ref={searchContainerRef}
            className={cn(
              'relative flex max-w-2xl items-center gap-14 rounded-full border pr-22.5 pl-11 transition-all duration-200 ease-in-out max-lg:hidden',
              !isScrolled
                ? 'bg-background/60 border-white/5 shadow-lg backdrop-blur-2xl'
                : 'scale-90 border-transparent bg-transparent shadow-none',
            )}
          >
            {navbarData?.nav_items ? (
              navbarData.nav_items.map((item) => (
                <NavItem key={item.name} href={item.to}>
                  <div
                    className="flex items-center justify-center [&>svg]:h-7 [&>svg]:w-7"
                    dangerouslySetInnerHTML={{ __html: item.icon }}
                  />
                  <span className="trim font-medium">{item.name}</span>
                </NavItem>
              ))
            ) : (
              <>
                <NavItem href="/store?platform=pc">
                  <PCIcon />
                  <span className="trim font-medium">PC</span>
                </NavItem>
                <NavItem href="/store?platform=xbox">
                  <XboxIcon />
                  <span className="trim font-medium">Xbox</span>
                </NavItem>
                <NavItem href="/store?platform=playstation">
                  <PlayStationIcon />
                  <span className="trim font-medium">PlayStation</span>
                </NavItem>
                <NavItem href="/store?platform=nintendo">
                  <NintendoIcon />
                  <span className="trim font-medium">Nintendo</span>
                </NavItem>
              </>
            )}

            {/* Search Button + Expanded Input */}
            <div
              className={cn(
                'bg-primary shadow-primary/20 absolute inset-y-0 right-0 -m-px flex w-16 items-center overflow-hidden rounded-full text-white shadow-md transition-all duration-300',
                searchOpen &&
                'w-[calc(100%+2px)] overflow-visible ring-2 ring-white',
              )}
            >
              {/* Search icon / open button */}
              <div
                role="button"
                aria-label="Open search"
                className={cn(
                  'absolute inset-y-0 left-0 flex aspect-square items-center justify-center rounded-full transition hover:bg-white/10 active:scale-90 active:bg-transparent',
                  searchOpen && 'pointer-events-none',
                )}
                onClick={() => setSearchOpen(true)}
              >
                <SearchIcon />
              </div>

              {/* Input */}
              <input
                ref={searchRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                aria-label="Search products"
                className="bg-primary h-full w-full rounded-full px-16 text-lg font-medium text-white transition-all placeholder:text-white/60 focus:outline-none"
                placeholder="Search for games, software & more"
              />

              {/* Suggestions dropdown */}
              {suggestionsOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 left-0 min-w-100">
                  <SearchSuggestions
                    suggestions={suggestions}
                    isLoading={isLoading && shouldFetch}
                    query={debouncedQuery}
                    onSelect={handleSelectProduct}
                    onSearchAll={() => navigateToStore(inputValue)}
                  />
                </div>
              )}

              {/* Close button */}
              <div
                role="button"
                aria-label="Close search"
                className={cn(
                  'absolute inset-y-0 right-0 flex aspect-square items-center justify-center rounded-full transition hover:bg-white/10 active:scale-90 active:bg-transparent',
                  !searchOpen && 'pointer-events-none opacity-0',
                )}
                onClick={() => setSearchOpen(false)}
              >
                <XIcon />
              </div>
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-5">
            {/* Mobile Search Icon */}
            <button
              aria-label="Open mobile search"
              onClick={() => setMobileSearchOpen(true)}
              className="flex items-center justify-center transition-opacity hover:opacity-80 focus:outline-none lg:hidden"
            >
              <div className="size-6 text-white [&>svg]:h-full [&>svg]:w-full">
                <SearchIcon />
              </div>
            </button>

            <UserMenu />
            <div className="hidden text-white transition-colors lg:block">
              <CartDrawer />
            </div>
          </div>
        </div>
      </nav>
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        navItems={navbarData?.nav_items}
      />

      <MobileSearch
        isOpen={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
      />
    </>
  )
}
