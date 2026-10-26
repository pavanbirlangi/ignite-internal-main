'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
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
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions'
import type { ProductListItem } from '@/types/product'
import SearchSuggestions from '../home/SearchSuggestions'
import { MobileSidebar } from './MobileSidebar'
import { MobileSearch } from './MobileSearch'
import { PlatformNav, type PlatformNavItem } from './navbar/PlatformNav'
import { UserMenu } from './navbar/UserMenu'
import type { NavbarData } from '@/lib/services/navbar.service'
import { OPEN_SEARCH_EVENT } from '@/lib/utils/open-search'

// Used when the CMS navbar has no items. Each icon sits in a div so it lifts like the CMS icons.
const DEFAULT_PLATFORM_ITEMS: PlatformNavItem[] = [
  { name: 'PC', href: '/store?platform=pc', icon: <div className="[&>svg]:size-6"><PCIcon /></div> },
  { name: 'Xbox', href: '/store?platform=xbox', icon: <div className="[&>svg]:size-6"><XboxIcon /></div> },
  {
    name: 'PlayStation',
    href: '/store?platform=playstation',
    icon: <div className="[&>svg]:size-6"><PlayStationIcon /></div>,
  },
  {
    name: 'Nintendo',
    href: '/store?platform=nintendo',
    icon: <div className="[&>svg]:size-6"><NintendoIcon /></div>,
  },
]

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
  const searchRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)
  const { isAuthenticated, user, fetchUser } = useUserStore()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Closing the search clears its text (the effect on searchOpen below).
  const navigateToStore = useCallback(
    (q: string) => {
      setSearchOpen(false)
      router.push(buildStoreSearchRoute(q))
    },
    [router],
  )

  const handleSelectProduct = (product: ProductListItem) => {
    setSearchOpen(false)
    router.push(buildProductRoute(product))
  }

  const {
    inputValue,
    setInputValue,
    activeIndex,
    resetActive,
    debouncedQuery,
    suggestions,
    suggestionsOpen,
    isLoading,
    handleKeyDown: handleSuggestionKeys,
  } = useSearchSuggestions({
    open: searchOpen,
    onSelectProduct: handleSelectProduct,
    onSearchAll: navigateToStore,
  })

  // The cart, checkout and order confirmation pages render their own step navbar.
  const navHidden =
    pathname?.includes('/cart') ||
    pathname?.includes('/checkout') ||
    pathname?.includes('/order/confirmation')

  const openSearch = useCallback(() => {
    resetActive()
    setSearchOpen(true)
  }, [resetActive])

  // "/" (when not typing) or Ctrl/Cmd+K opens the search from anywhere.
  useEffect(() => {
    if (navHidden) return
    const onShortcut = (e: globalThis.KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest(
        'input, textarea, select, [contenteditable="true"]',
      )
      const isShortcut =
        (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey)
      if (!isShortcut) return
      e.preventDefault()
      if (window.matchMedia('(min-width: 1024px)').matches) openSearch()
      else setMobileSearchOpen(true)
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [navHidden, openSearch])

  // Other parts of the page can open the search too (openSiteSearch, e.g. the 404 page).
  useEffect(() => {
    if (navHidden) return
    const onOpen = () => {
      if (window.matchMedia('(min-width: 1024px)').matches) openSearch()
      else setMobileSearchOpen(true)
    }
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, onOpen)
  }, [navHidden, openSearch])

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
      // No scroll: the bar is still a small circle at this point, and scrolling it to the caret
      // would push the magnifier out of view while it grows.
      searchRef.current?.focus({ preventScroll: true })
      searchRef.current?.select()
    } else {
      document.body.style.overflow = 'unset'
      // The hidden input mustn't keep focus, or "/" would type into it instead of reopening.
      if (document.activeElement === searchRef.current) searchRef.current?.blur()
      // Reset input when closing
      setInputValue('')
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [searchOpen, setInputValue])

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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    handleSuggestionKeys(e)
    if (e.key === 'Escape') setSearchOpen(false)
  }

  // CartNavbar (Cart -> Checkout -> Redeem step flow) renders its own
  // navbar/logo for this route group, so the global one hides itself.
  if (navHidden) {
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
                // Directus serves the logo as an 889 px PNG (73 KB) for a ~200 px slot: resized to
                // WebP like other images (an SVG fallback is served as is by lib/image-loader.ts).
                // At the top of every page, so it isn't lazy-loaded.
                sizes="(max-width: 640px) 150px, 210px"
                loading="eager"
              />
            </Link>
          </div>
          {/* Central Search / Platform Bar */}
          <div
            ref={searchContainerRef}
            className={cn(
              'relative flex max-w-2xl items-center rounded-full border py-2 pr-18.5 pl-7 transition-all duration-200 ease-in-out max-lg:hidden',
              !isScrolled
                ? 'bg-background/60 border-white/5 shadow-lg backdrop-blur-2xl'
                : 'scale-90 border-transparent bg-transparent shadow-none',
            )}
          >
            <PlatformNav
              hidden={searchOpen}
              items={
                navbarData?.nav_items
                  ? navbarData.nav_items.map((item) => ({
                      name: item.name,
                      href: item.to,
                      icon: (
                        <div
                          className="flex items-center justify-center [&>svg]:h-6 [&>svg]:w-6"
                          dangerouslySetInnerHTML={{ __html: item.icon }}
                        />
                      ),
                    }))
                  : DEFAULT_PLATFORM_ITEMS
              }
            />

            {/* Search: a round button that grows into a search bar over the platform items. */}
            <div
              className={cn(
                'peer/search group/search bg-primary absolute inset-y-0 right-0 -m-px flex w-16 items-center overflow-hidden rounded-full text-white/95',
                'transition-[width,scale,box-shadow,filter] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                searchOpen
                  ? 'w-[calc(100%+2px)] shadow-[0_0_0_1px_rgba(255,255,255,0.22),0_0_36px_-6px_rgba(36,104,223,0.9)]'
                  : 'shadow-primary/30 shadow-md hover:scale-106 hover:shadow-[0_0_26px_-2px_rgba(36,104,223,0.75)] hover:brightness-110 active:scale-95',
              )}
              // The width waits a moment (one delay per transitioned property above) so the
              // platform items have faded before the bar reaches them, and on closing so the
              // text has faded before the bar shrinks. Hover effects stay instant.
              style={{
                transitionDelay: `${searchOpen ? 60 : 110}ms, 0ms, 0ms, 0ms`,
              }}
            >
              <button
                type="button"
                aria-label="Open search"
                aria-keyshortcuts="/ Control+K Meta+K"
                tabIndex={searchOpen ? -1 : 0}
                className={cn(
                  'absolute inset-y-0 left-0 z-10 flex aspect-square items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                  '[&_svg]:transition-transform [&_svg]:duration-300 [&_svg]:ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                  searchOpen
                    ? 'pointer-events-none'
                    : 'group-hover/search:[&_svg]:scale-110 group-hover/search:[&_svg]:-rotate-12',
                )}
                onClick={openSearch}
              >
                <SearchIcon />
              </button>

              {/* Fades in once the bar has room, so the placeholder is never clipped. */}
              <input
                ref={searchRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                role="combobox"
                aria-label="Search products"
                aria-expanded={suggestionsOpen}
                aria-controls="navbar-search-results"
                aria-activedescendant={
                  activeIndex >= 0
                    ? `navbar-search-option-${activeIndex}`
                    : undefined
                }
                tabIndex={searchOpen ? 0 : -1}
                className={cn(
                  'bg-primary h-full w-full rounded-full px-16 text-xl font-medium text-white/95 placeholder:text-white/60 focus:outline-none',
                  'transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none',
                  searchOpen
                    ? 'translate-x-0 opacity-100 delay-200 duration-300'
                    : 'pointer-events-none translate-x-2 opacity-0 duration-100',
                )}
                placeholder="Search for games, software & more"
              />

              <button
                type="button"
                aria-label="Close search"
                tabIndex={searchOpen ? 0 : -1}
                className={cn(
                  'absolute inset-y-0 right-0 flex aspect-square items-center justify-center rounded-full hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-90',
                  'transition-[opacity,rotate,scale,background-color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none',
                  searchOpen
                    ? 'scale-100 rotate-0 opacity-100 delay-200'
                    : 'pointer-events-none scale-50 -rotate-90 opacity-0',
                )}
                onClick={() => setSearchOpen(false)}
              >
                <XIcon />
              </button>
            </div>

            {/* Hover hint under the closed button */}
            {!searchOpen && (
              <span
                aria-hidden
                className="bg-secondary/95 pointer-events-none absolute top-full right-0 mt-3 flex -translate-y-1 items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white/95 opacity-0 shadow-lg backdrop-blur transition-[opacity,translate] duration-200 peer-hover/search:translate-y-0 peer-hover/search:opacity-100 peer-hover/search:delay-300"
              >
                Search
                <kbd className="rounded border border-white/15 bg-white/5 px-1.5 font-sans text-xs text-white/95">
                  /
                </kbd>
              </span>
            )}

            {/* Suggestions dropdown */}
            {suggestionsOpen && (
              <div
                id="navbar-search-results"
                className="absolute top-[calc(100%+8px)] right-0 left-0 min-w-100"
              >
                <SearchSuggestions
                  suggestions={suggestions}
                  isLoading={isLoading}
                  query={debouncedQuery}
                  onSelect={handleSelectProduct}
                  onSearchAll={() => navigateToStore(inputValue)}
                  activeIndex={activeIndex}
                  idPrefix="navbar-search-option"
                />
              </div>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {/* Mobile Search Icon */}
            <button
              aria-label="Open mobile search"
              onClick={() => setMobileSearchOpen(true)}
              className="flex items-center justify-center transition-opacity hover:opacity-80 focus:outline-none lg:hidden"
            >
              <div className="size-6 text-white/95 [&>svg]:h-full [&>svg]:w-full">
                <SearchIcon />
              </div>
            </button>

            <UserMenu />
            <div className="hidden text-white/95 transition-colors lg:block">
              <CartDrawer />
            </div>
          </div>
        </div>
      </nav>
      {/* Dims and blurs the page while the desktop search is open; clicking it closes the search
          (the outside-click handler above). Portaled because the scrolled header's backdrop blur
          would otherwise trap a fixed element inside the header. */}
      {isClient &&
        createPortal(
          <div
            aria-hidden
            className={cn(
              'fixed inset-0 z-40 bg-black/50 backdrop-blur-[3px] transition-opacity duration-300 motion-reduce:transition-none max-lg:hidden',
              searchOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          />,
          document.body,
        )}
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
