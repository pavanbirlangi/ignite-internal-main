# Increddy — Full Codebase Report

> **Purpose of this file**: a single document any developer (or any future Claude session) can read once to fully understand this project — what it is, every API it talks to, how data flows and is cached/rendered, and how the UI is laid out on desktop vs. mobile. Written 2026-09-01 from a full repo inspection (not just `package.json`).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Routing, i18n & Region Middleware](#3-routing-i18n--region-middleware)
4. [All APIs Used](#4-all-apis-used)
5. [Data Flow & State Management](#5-data-flow--state-management)
6. [UI Structure — Desktop & Mobile](#6-ui-structure--desktop--mobile)
7. [Known Issues / Consolidation Opportunities](#7-known-issues--consolidation-opportunities)

---

## 1. Project Overview

**Increddy** (increddy.com) is a **digital storefront for game keys** — an e-commerce site where users browse games, buy digital license keys, and redeem them, similar in nature to Driffle/Kinguin/G2A. It is built with **Next.js 16 (App Router) + React 19**, and is **not** a standalone backend — it is a frontend/BFF-consumer that sits in front of:

- A custom **main backend API** (itself a BFF in front of **Shopify**, given the GID-style customer/product IDs, `merchandiseId`, `checkoutUrl`, GraphQL-edges shapes throughout).
- A **Directus CMS** for all marketing/content pages (home, about, legal, help, footer, navbar, contact, activation guides).
- Third-party services: **Shopify Storefront GraphQL** (password reset), **HelpDesk.com** (support tickets), **DeepL** + **Langbly** (translation), **ipapi.co** (IP geolocation fallback).

The app supports **multi-locale routing** (`/en`, `/ro`, etc.), **multi-currency/region pricing** (driven by cookies set at the edge), a **cart** (guest + authenticated, cookie-persisted), **user accounts** with OAuth, a **dashboard** (library of owned games, orders, wishlist, profile, support tickets), and a CMS-driven **help center**.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), Turbopack-compatible build (`productionBrowserSourceMaps: true` because custom Webpack `devtool` isn't supported under Turbopack) |
| UI | React 19, TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Components | Radix UI primitives + shadcn/ui (`components/ui/*`) |
| State | Zustand 5 (no `persist` middleware — persistence is hand-rolled via `js-cookie`) |
| Server-cache / data fetching | TanStack React Query v5 |
| HTTP client | Axios (two instances — see §4.0) |
| Forms | React Hook Form + Zod |
| Carousel | Embla Carousel React |
| Icons | Lucide React |
| Notifications | Sonner (toasts) |
| PDF generation | jsPDF (order receipts / key exports) |
| Phone input | react-international-phone + libphonenumber-js |
| Translation SDKs | `deepl-node`, raw fetch to Langbly |

Scripts: `npm run dev`, `build`, `start`, `lint` (ESLint 9), `format` (Prettier). Deployed on Vercel.

---

## 3. Routing, i18n & Region Middleware

All pages live under `app/[locale]/...`. Locale detection and region/currency resolution happen in **`proxy.ts`** (the Next.js middleware, exported as `proxy` and matched via `config.matcher` to skip `/api`, static assets, etc.):

1. **Locale**: if the first path segment matches a known 2-letter language code (`lib/region-data.ts`), it's used as-is; otherwise the request is redirected to `/{language}/...` where `language` comes from the `user_language` cookie or defaults to `en`.
2. **Region/currency resolution**: reads `cf-ipcountry` / `x-vercel-ip-country` edge headers (default `'IN'`), reconciles with existing `user_country`/`user_currency`/`user_language` cookies, and writes them back (365-day expiry). A `?currency=XX` query param can force-override (validated against `lib/region-data.ts`'s currency list; invalid values get stripped via redirect).
3. **Protected routes**: `/dashboard/*` requires an `access_token` cookie. If present, the middleware does a **direct `fetch`** (not through `apiClient`) to `${NEXT_PUBLIC_API_URL}/account/me?country=` to validate the session; a 401/403 or null customer/user payload clears the cookie and redirects to the localized home. No token → immediate redirect.
4. Static/localized asset requests (paths containing a dot, e.g. `/en/icon.svg`) are rewritten to strip the locale prefix.

**Image handling** (`next.config.ts`): Next/Image is configured with a **custom loader** (`lib/image-loader.ts`) that rewrites `/cdn-shopify/*` proxy paths to `https://cdn.shopify.com/*` so Shopify product images can be optimized (served as WebP/AVIF, 24h cache) without 400 errors from Next's default loader. Allowed remote hosts: `placehold.co`, `cdn.shopify.com`, `api.ignkeys.agpro.co.in`, `flagcdn.com` (country flags), `cms.increddy.com`.

**SEO**: `app/robots.ts` disallows `/*/dashboard/`, `/*/cart/`, `/api/`. `app/sitemap.ts` builds localized alternates for static pages plus dynamically paginates through `ProductService.getProducts()` (up to 20 pages of 100) to include every product slug per locale.

---

## 4. All APIs Used

### 4.0 HTTP Client Infrastructure

Two Axios instances:

- **`lib/axios.ts` → `apiClient`** — talks to the main backend (`NEXT_PUBLIC_API_URL`). Request interceptor injects `Authorization: Bearer <access_token>` (from cookie client-side, from `next/headers` server-side) and appends a `country` query param to every GET from the `user_country` cookie (caller can override). Response interceptor: on **HTTP 401**, dynamically imports `useUserStore`, logs the user out, and redirects home; also normalizes error messages via `extractApiErrorMessage`.
- **`lib/cms-axios.ts` → `cmsClient`** — plain instance for the Directus CMS (`NEXT_PUBLIC_CMS_API_URL`), no auth, no interceptors.

### 4.1 Auth

`lib/services/auth.service.ts` (via `apiClient`):

| Method | Endpoint | Function | Purpose |
|---|---|---|---|
| POST | `/auth/register` | `register()` | Create account |
| POST | `/auth/login` | `login()` | Returns `{token:{accessToken,expiresAt}}` |
| POST | `/auth/recover` | `recover()` | Trigger password-recovery email |
| GET | `/account/me` | `getAccount()` | Fetch logged-in profile |
| PUT | `/account/me` | `updateAccount()` | Update profile fields |
| POST | `/account/upload-image` | `uploadAccountImage()` | Upload avatar (multipart) |
| DELETE | `/account/delete-image` | `deleteAccountImage()` | Remove avatar |
| POST | *(own Next.js route)* `/api/auth/reset-password` | `customerReset()` | See §4.11 — proxies to Shopify GraphQL |

Consumers: `store/useUserStore.ts`, `hooks/useProfileForm.ts`, `AuthModal` and its child forms.

### 4.2 Products / Store / Filters

`lib/services/product.service.ts` (via `apiClient`, with Next.js caching):

| Method | Endpoint | Function | Caching |
|---|---|---|---|
| GET | `/products` | `getProducts()` | filterable/paginated catalog listing |
| GET | `/products/{handle}` | `getProductByHandle()` | `unstable_cache` 60s tag `product` + React `cache()` per-render dedupe |
| GET | `/products/{handle}/recommendations` | `getProductRecommendations()` | cached 60s |
| GET | `/products/{handle}/features` | `getProductFeatures()` | cached 60s, returns `null` on error |
| GET | `/collections/{handle}/products` | `getCollectionProductsByHandle()` | cached 60s |

Filter-facet services (all thin GET wrappers, `apiClient`): `category.service.ts` (`/categories`), `genre.service.ts` (`/genres?search=`), `platform.service.ts` (`/platforms`), `region.service.ts` (`/regions?search=`), `works-on.service.ts` (`/works-on`).

CMS enrichment for PDP: `lib/services/cms-product.service.ts` — GET Directus `/items/products?filter[slug]=` (system requirements, gallery, dropdown variant-option groups), `unstable_cache` 60s tag `cms-product`.

`lib/services/store.service.ts` — GET Directus `/items/store` (store landing hero/SEO CMS content).

### 4.3 Cart

`lib/services/cart.service.ts` (`apiClient` for cart ops, `cmsClient` for copy):

| Method | Endpoint | Function |
|---|---|---|
| POST | `/cart` | `createCart()` |
| GET | `/cart/{cartId}` | `getCart()` |
| GET | `/cart/{cartId}/recommendations` | `getRecommendations()` |
| POST | `/cart/add` | `addToCart()` |
| POST | `/cart/transfer` | `transferCart()` (guest → logged-in-user cart merge) |
| POST | `/cart/remove` | `removeFromCart()` |
| POST | `/cart/update` | `updateCart()` |
| GET | `/items/cart` (cmsClient) | `getCartCmsData()` |

Cart ID persists in the `increddy_cart_id` cookie (30 days). Managed entirely by `store/useCartStore.ts` (no dedicated hook).

### 4.4 Orders & License Keys

`lib/services/order.service.ts` (`apiClient`): GET `/orders` (paginated history, tab/search/sort/cursor params), GET `/orders/{id}` (full detail — line items, payment method, refunds, tax).

`lib/services/keys.service.ts` (`apiClient`): GET `/keys?orderId=&email=` — fetches redeemed license keys for a completed order.

Consumers: `store/useOrderStore.ts`, `OrderDetailsClient.tsx`, `RevealProductModal.tsx`.

### 4.5 Library (owned games)

`lib/services/library.service.ts` (`apiClient`): GET `/library` (page/limit/sort/order/search/category/platform/productType). Consumed by a hand-rolled hook, `hooks/useLibraryFilters.ts` (not React Query — takes `fetchFn` as a dependency-injected param).

### 4.6 Wishlist

`lib/services/wishlist.service.ts` (`apiClient`):

| Method | Endpoint | Function |
|---|---|---|
| POST | `/wishlist/add` | `addToWishlist()` |
| GET | `/wishlist` | `getWishlist()` |
| POST | `/wishlist/remove` | `removeFromWishlist()` |
| GET | `/wishlist/check/{productId}` | `checkWishlistStatus()` |

Consumed via `hooks/useWishlist.ts` (React Query: `useWishlist`, `useAddToWishlist`/`useRemoveFromWishlist` mutations invalidating `['wishlist']`/`['wishlist-status']`, `useWishlistStatus`).

### 4.7 Reviews

`lib/services/review.service.ts` (`apiClient`): GET `/reviews` (heavily defensive normalization of many possible backend field names/pagination shapes), POST `/reviews` (submit). Consumed via `hooks/useReviews.ts` (`useInfiniteQuery`).

### 4.8 Help / Support

**CMS-driven help content** — `lib/services/help.service.ts` (`cmsClient`): `/items/help` (categories), `/items/help_subtopics` (topics), `/items/help_articles` (articles), `/items/activation_guide` + `/items/guides` (activation guides, list/detail/search), `/items/contact_us` (Contact page).

**Real support ticketing** — `lib/services/helpdesk.service.ts` calls this app's **own** `/api/helpdesk/*` proxy routes (never HelpDesk.com directly from the client), with mapping utilities translating HelpDesk's schema into the app's `Ticket`/`Message` types. See §4.11 for the actual proxy routes.

### 4.9 CMS Content (Directus)

All via `cmsClient`, GET only: `about.service.ts` (`/items/about_us`), `legal.service.ts` (`/items/legal_pages` by slug, and slug index), `homepage.service.ts` (`/items/homepage`, `unstable_cache` 60s tag `homepage` + React `cache()`), `footer.service.ts` (`/items/footer`), `navbar.service.ts` (`/items/navbar`).

### 4.10 Region / Markets / Currency

`lib/services/markets.service.ts` (`apiClient`, swallows errors → `[]`): GET `/markets`, GET `/markets/currencies`. Consumed by `store/useCurrencyStore.ts`, which resolves country/currency/language on boot in this order: cookies (set by `proxy.ts`) → validate against `getMarkets()` → fallback to **`https://ipapi.co/json/`** (client-side geo-IP) → hardcoded IN/INR/EN default. Resolved values are persisted back to cookies (365 days).

### 4.11 Next.js API Routes (server-side proxies, in `app/api/`)

| Route | Method | External call | Purpose |
|---|---|---|---|
| `/api/oauth-callback` | GET | none (returns HTML) | OAuth popup bridge: reads `accessToken`/`expiresAt` query params, returns a page whose script does `window.opener.postMessage({type:'OAUTH_SUCCESS'|'OAUTH_ERROR'})` then closes itself |
| `/api/auth/reset-password` | POST | Shopify Storefront GraphQL (`${SHOP_URL}/api/2024-04/graphql.json`, `X-Shopify-Storefront-Access-Token` header) | Runs the `customerReset` mutation directly against Shopify to set a new password from a reset token |
| `/api/helpdesk/tickets` | POST | `https://api.helpdesk.com/v1/tickets` (Basic Auth) | Create a new support ticket |
| `/api/helpdesk/my-tickets` | GET | `https://api.helpdesk.com/v1/tickets?...` | Lists tickets, filtered server-side by requester email (HelpDesk's API doesn't support this natively) |
| `/api/helpdesk/attachments` | POST | `https://api.helpdesk.com/v1/transactions` + `.../attachments` | Two-step: create a "transaction", then upload files to it |
| `/api/helpdesk/ticket/[id]` | GET / POST | `https://api.helpdesk.com/v1/tickets/{id}` (GET), `PATCH` internally on POST | Fetch ticket + conversation / add a reply message |

All four HelpDesk routes centralize `HELPDESK_ACCOUNT_ID`/`HELPDESK_API_TOKEN` Basic-Auth so credentials never reach the client bundle.

### 4.12 Translation (two independent providers)

- **DeepL** (`lib/services/translation.service.ts`) — via the `deepl-node` SDK (`DEEPL_AUTH_KEY`). Maps app language codes to DeepL codes, skips English and a hardcoded unsupported set (`TL,BN,HE,NO,AR,KO`), 1-hour in-memory cache, falls back to original text on failure.
- **Langbly** (`lib/services/langbly-translation.service.ts`) — raw `fetch('https://api.langbly.com/language/translate/v2')` with `X-API-Key`. Same caching/fallback pattern. Both providers are imported together in the same server pages (home, contact, about, activation guides, legal, product, store) — likely a fallback/redundancy arrangement rather than a clean either/or split.

### 4.13 Third-Party APIs Called Directly (bypassing the main backend)

| Service | Endpoint | Purpose | Auth |
|---|---|---|---|
| Shopify Storefront GraphQL | `${SHOP_URL}/api/2024-04/graphql.json` | Password reset mutation | `X-Shopify-Storefront-Access-Token` |
| HelpDesk.com | `https://api.helpdesk.com/v1/*` | Ticketing | Basic Auth (server-only) |
| Langbly | `https://api.langbly.com/language/translate/v2` | Translation | `X-API-Key` |
| DeepL | via SDK | Translation | `DEEPL_AUTH_KEY` |
| ipapi.co | `https://ipapi.co/json/` | Client-side IP geolocation fallback | none |

### 4.14 Hooks Quick-Reference (query key / cache config)

| Hook | Service | Query key | staleTime |
|---|---|---|---|
| `useProducts` | `ProductService.getProducts` | `['products', params]` | 30s (provider default) |
| `useCategories` | `CategoryService.getCategories` | `['categories']` | 5min |
| `useGenres` | `GenreService.getGenres` | `['genres', search]` | 5min |
| `usePlatforms` | `PlatformService.getPlatforms` | `['platforms']` | 5min |
| `useRegions` | `RegionService.getRegions` | `['regions', search]` | 5min |
| `useWorksOn` | `WorksOnService.getWorksOn` | `['works-on']` | 5min |
| `useReviews` | `reviewService.getReviews` | `['reviews', params]` (infinite) | — |
| `useWishlist` / mutations / `useWishlistStatus` | `wishlistService.*` | `['wishlist', params]`, `['wishlist-status', id]` | 30s |
| `useAboutUs` | `AboutService.getAboutUsPage` | `['about-us']` | 5min |
| `useActivationGuides` / detail / search | `HelpService.*` | `['activation-guides']`, `['activation-guide', slug]`, `['activation-guides-search', q]` | 5min / 5min / 1min |
| `useContactUs` | `HelpService.getContactUsPage` | `['contact-us']` | 5min |
| `useLegalPage` / `useLegalPages` | `LegalService.*` | `['legal-page', slug]`, `['legal-pages-list']` | 5min |
| `useLibraryFilters` | injected (`libraryService.getLibrary`) | plain `useState`/`useEffect`, not React Query | — |
| `useProfileForm` | `authService.*` | imperative, not React Query | — |

Cart, Orders, Keys, Homepage, Footer, Navbar, Store, Markets, and CMS-Product services have **no dedicated hooks** — they're consumed via Zustand stores or called directly in Server Components.

---

## 5. Data Flow & State Management

### 5.1 Zustand Stores (`/store`)

No store uses `zustand/middleware`'s `persist` — all durable persistence is hand-rolled via `js-cookie` **cookies**, not `localStorage`.

| Store | Holds | Persistence | Notes |
|---|---|---|---|
| **`useUserStore`** | `user`, `isAuthenticated`, `isLoading` | reads/clears `access_token` cookie | `logout()` also clears the cart (`useCartStore.getState().clearCart()`) — cross-store composition |
| **`useAuthModalStore`** | `open`, `mode` (login/register/recover/email-sent) | none (pure UI state) | triggered from many places app-wide to gate checkout/actions behind login |
| **`useCartStore`** | `cartId`, `cart`, `cartCmsData`, `recommendations`, loading/error flags | `increddy_cart_id` cookie, 30 days | orchestrates `initCart → loadCart → loadRecommendations`; handles expired-cart (cart-not-found) by clearing the cookie and reinitializing; `transferGuestCartToUser()` runs post-login |
| **`useOrderStore`** | `orders`, tab/search/sort filters, cursor pagination | none — refetched on filter change | drives the My Orders page end-to-end |
| **`useCurrencyStore`** | `country`, `currency`, `language` | `user_country`/`user_currency`/`user_language` cookies, 365 days | validates against `marketsService.getMarkets()`, falls back to `ipapi.co` geolocation, then hardcoded IN/INR/EN |
| **`useStoreFilters`** | price range, search, selected platforms/genres/worksOn/regions/productTypes, sort, page, cursors | none — **the URL query string is the real persistence layer** | `StoreListing.tsx` syncs `useSearchParams()` ⇄ store on every navigation |

### 5.2 React Query Setup

`components/providers/QueryProvider.tsx` — one `QueryClient` per app lifetime (via `useState`), **global `staleTime: 30s`** (commented as tuned for fast-changing product/price data). No custom retry/gcTime overrides (TanStack defaults apply). Devtools mount only outside production, closed by default. Individual hooks override to 5 minutes for slow-changing reference/CMS data (see table in §4.14).

### 5.3 Server vs. Client Rendering Pattern

- **Server Components performing direct `await` calls into `lib/services/*`, with `generateMetadata` + JSON-LD**: Home (`app/[locale]/page.tsx`, `revalidate = 900`/15min ISR), Store page shell (`app/[locale]/store/page.tsx`), Product Detail (`app/[locale]/[slug]/page.tsx`, fetches product + recommendations + CMS data + features + first-page reviews in parallel via `Promise.allSettled`, no `generateStaticParams` — fully dynamic/on-demand), and all CMS pages (about, contact, categories, activation guides, legal, help). Several of these layer a non-English translation pass on top (DeepL/Langbly) before rendering.
- **Client Components (session/interaction-heavy)**: `StoreListing.tsx` (product grid — reads URL params into `useStoreFilters`, calls `useProducts` + filter-facet hooks, pushes changes back to the URL), `CartPageContent.tsx` (via `useCartStore`), all of `/dashboard/*` (orders, library, wishlist, profile, tickets — driven by Zustand stores, React Query hooks, or hand-rolled fetch hooks depending on the page).
- **Caching mechanics**: `product.service.ts`, `homepage.service.ts`, `cms-product.service.ts` wrap fetchers in `unstable_cache(fn, [key], {revalidate: 60, tags:[...]})` (60s Next.js Data Cache TTL) plus React's `cache()` for per-render dedupe (so `generateMetadata` and the page body don't double-fetch). No route uses `generateStaticParams` — everything is dynamic SSR, cached at the service layer instead of via static generation.

### 5.4 Mappers / Formatters

- `lib/mappers/wishlist.mapper.ts` — normalizes wishlist API product shape into the same `ProductListItem` shape the store grid uses, so `StoreCard` renders both identically.
- `lib/orders/order-formatters.ts` — `formatOrderDate`, `formatOrderPrice`.
- `lib/orders/order-confirmation.ts` — builds an `OrderConfirmationViewModel` (tri-state success/processing/failed, payment mode string, item summary string, formatted amounts) from a raw order — a clean "API → view-model" mapper.
- `lib/reviews/review-formatters.ts` — date formatting, review-count formatting, rating-percentage clamping for star bars.

### 5.5 Core Domain Types

- **`types/product.ts`**: `Product` (full PDP shape — supports both Shopify GraphQL edges *and* flat array shapes for variants/images, tolerating whichever the backend returns) and `ProductListItem` (lighter grid/card shape used by store listing, recommendations, wishlist, similar games), plus `PageInfo`/`GetProductsResponse` (cursor pagination envelope).
- **`types/cms-product.ts`**: Directus-only PDP concerns (system requirements, gallery, dropdown variant-option groups).
- **`types/library.ts`**: `LibraryItem` (a *purchased* product, carrying order/purchase metadata alongside product fields), `LibraryFilters`/`LibraryFacets`/`LibraryResponse`.
- **`types/review.ts`**: `ProductReview`, `ProductReviewSummary`, paginated `ProductReviewsResponse`, `SubmitReviewPayload`.
- **`types/store/types.ts`**: a **second, narrower `Product` interface** (see §7) plus `FilterOption`/`SortOption` for the store filter/sort UI.
- **Order shape**: lives inside `lib/services/order.service.ts` (no `types/order.ts`) — `Order`/`OrderDetails` with defensive `normalizeOrdersResponse`/`normalizeOrderDetailsResponse` functions tolerating multiple possible backend response shapes.

---

## 6. UI Structure — Desktop & Mobile

Root layout (`app/[locale]/layout.tsx`): `Navbar` → `{children}` → `ConditionalFooter` (hidden on `/cart` and `/dashboard/*`, otherwise picks `FooterV2` vs `Footer` by CMS flag) → `MobileNav` (fixed bottom bar, global) → `Toaster`.

### 6.1 Responsive Strategy (summary)

- Breakpoints follow Tailwind defaults: **`lg:`** is the main mobile/desktop split for chrome (nav, sidebars, filters); `md:` mostly scales typography/grid columns; `sm:` handles small flex-direction/2-col tweaks.
- **Dominant pattern**: both mobile and desktop variants are rendered in the DOM simultaneously and toggled with `hidden md:flex` / `md:hidden` etc., rather than JS viewport checks. Examples: `FilterSidebar` (`hidden lg:block`) vs `MobileFilter` (`lg:hidden`); dashboard `Sidebar` (`hidden lg:flex`) vs `MobileSidebar` (`lg:hidden`); `OrderTabs`/`LibraryTabs` (mobile dropdown vs desktop tab row).
- **Bottom tab bar** (`components/layout/MobileNav.tsx`, `fixed bottom-0 md:hidden`): Home/Store/Cart/Categories with a cart-count badge — mobile only; desktop has no equivalent, relying on the top `Navbar`.
- **Hamburger drawer** (`components/layout/MobileSidebar.tsx`): left slide-in panel, CMS-driven nav items, triggered by a `lg:hidden` button in `Navbar`.
- **Mobile search overlay** (`components/layout/MobileSearch.tsx`): full-viewport fixed overlay (`md:hidden`), distinct from the desktop inline expanding search bar built into `Navbar` (`max-lg:hidden`).
- **Filters**: desktop persistent left `FilterSidebar` (~288px); mobile `MobileFilter.tsx` opens a portal-rendered slide-in panel reusing the same `FilterSidebar` component (state/logic shared, chrome differs).
- **Product grids**: responsive column counts, not hide/show — `grid-cols-2 → md:grid-cols-3 → lg:grid-cols-4 → xl:grid-cols-5`.
- **Carousels** (home genre/platform rows, similar games, reviews): arrow controls appear only `lg:` and up; below that, native touch scroll with peek-next-item basis widths.
- **Genuine breakpoint-swapped components** (rare — most are hide/show of the same markup): `RatingReviews` shows a static 2-col grid at `md:` and up but a swipeable `Carousel` below it.
- **Cart recommendations** are duplicated in markup (`CartPageContent.tsx`) — shown inline under items on desktop (`hidden md:flex`), and after the order summary on mobile (`md:hidden`) — so ordering differs, not just visibility.

### 6.2 Page-by-Page

**Home (`/`)** — Hero (`HeroSection.tsx`, full-bleed background, search bar, feature badges) → CMS-driven carousel sections (`DiscoverByGenre`, `ExplorePlatforms`, `GameCarouselSection` — all `next/dynamic` with skeletons) → `NewsletterSection` (2-col on `lg:`, stacked on mobile). No structural mobile/desktop component swap — CSS scaling + carousel arrow hide/show only.

**Store / Catalog (`/store`)** — `StoreHero` banner → `StoreListing` (client): desktop shows persistent `FilterSidebar` + product grid + `Pagination`; mobile replaces the sidebar with a `MobileFilter` slide-in panel (same `FilterSidebar` component reused). Products render as `StoreCard`s in a responsive grid. Sort/filter chips (`FilterBar`) scroll horizontally on mobile.

**Product Detail (`/[slug]`)** — Hero (cover image + price/CTA card + feature tiles) is `flex-row` on desktop, stacks to single column on mobile. `Gallery.tsx` is a 2×2 thumbnail grid on desktop vs. a horizontally snap-scrolling row on mobile, both opening a full-screen `GalleryCarousel` lightbox. `SystemRequirements` shows Minimum/Recommended side-by-side on desktop, stacked on mobile. `RatingReviews` is a static grid on desktop, a swipeable carousel on mobile. `SimilarGames` is a `StoreCard` carousel.

**Cart & Checkout** — Two surfaces: (a) **`CartDrawer`**, a right-side slide-over "mini-cart" identical on mobile/desktop by design; (b) **full `/cart` page** (`CartPageContent.tsx`), which uses its own `CartNavbar` (the global `Navbar` self-hides on `/cart`) with a 3-step progress indicator. Desktop is a 12-col grid (items 8-col + sticky `OrderSummary` 4-col, "Recommended" shown inline below items); mobile collapses to a single column with "Recommended" moved to after the order summary.

**Dashboard (Library / Orders / Profile / Tickets / Wishlist)** — Shared shell: desktop fixed left `Sidebar` (~220px) vs. mobile dropdown-style `MobileSidebar` (both mounted simultaneously, toggled via `lg:` visibility). Each sub-page (My Library, My Orders, Wishlist, My Profile, My Tickets) follows the same mobile-dropdown/desktop-tab-row pattern for its own local nav (category/status filters), with product/order/ticket lists as vertically stacked cards that reflow from row to column layouts on mobile. Key-reveal happens in a shared `RevealProductModal` (centered dialog, same on both breakpoints, only width/padding scales).

**Auth** — A single centered `Dialog`-based `AuthModal` (no separate mobile drawer variant) hosts Login/Register/Recover forms plus confirmation screens; triggered from many places app-wide via `useAuthModalStore`.

**Help Center** — Issue-type picker → topics list → topic detail, plus a multi-step ticket-creation flow (`SelectOrder` → `CreateTicketForm` → success) that gates on login. Activation Guides is a searchable, paginated card grid.

**Legal / About / Contact** — Legal pages have a **desktop-only** sidebar nav (`hidden lg:flex`, no mobile fallback — a notable inconsistency vs. every other sidebar in the app, which all get a mobile equivalent). About/Contact are simple stacked marketing sections. Categories page (`/categories`) has **no `lg:` overrides at all** — it's essentially mobile-grid-first, matching its primary entry point (`MobileNav`'s "Categories" tab, which has no desktop nav equivalent).

### 6.3 Global Chrome Notes

- `Navbar` self-hides on `/cart` (its own `CartNavbar` takes over).
- `Navbar` toggles a scrolled/transparent state via a scroll listener (same behavior on both breakpoints, CSS-driven).
- `UserMenu` (in `components/layout/navbar/`) shows a `DropdownMenu` when authenticated or opens `AuthModal` when not — reused identically in `Navbar` and `CartNavbar`.
- Cart badge counts stay in sync across `MobileNav`, and both `CartDrawer` trigger locations, via the shared `useCartStore`.

---

## 7. Known Issues / Consolidation Opportunities

These are structural observations from the inspection, useful for anyone doing cleanup work:

1. **Duplicate `Product` types**: `types/product.ts` defines a `Product` (full PDP shape, dual Shopify-edges/flat-array tolerant) while `types/store/types.ts` defines a **second, narrower `Product`** interface used only by the store filter/sort UI. Same name, different shape, different module — a naming collision worth consolidating.
2. **No `types/order.ts`**: the `Order`/`OrderDetails` domain type lives inline inside `lib/services/order.service.ts` rather than in `/types`, inconsistent with how Product/Library/Review types are organized.
3. **Legal page sidebar has no mobile fallback** — `LegalSidebar.tsx` is `hidden lg:flex` with nothing shown below `lg:`, unlike every other sidebar pattern in the app (Store filters, Dashboard nav) which all provide a mobile drawer/dropdown equivalent.
4. **Two translation providers imported together** (DeepL + Langbly) in the same set of server pages — appears to be a fallback/redundancy setup rather than a clean primary/secondary split; worth confirming intent.
5. **Dual "Product" card components**: `components/store/StoreCard.tsx` and `components/store/ProductCard.tsx` both exist with overlapping purpose (StoreCard is the one actually used generically; ProductCard has slightly different markup/checkout-auth-gating logic) — potential duplication.
6. **`TransactionDetails.tsx` vs `TransactionDetailsGrid.tsx`** in `components/orders/` appear to be two styles of the same transaction-summary UI (list rows vs. grid layout) — check whether both are still needed.
7. **Backend response-shape tolerance everywhere** (orders, reviews, wishlist) — defensive normalizers exist because the backend returns inconsistent shapes (bare arrays vs. `{orders:[...]}` vs. Shopify-style `{edges:[...]}`) depending on endpoint/version. This is functioning as designed but signals the backend API itself isn't fully standardized.

---

*This report was generated via full-repository inspection (services, hooks, stores, types, page/layout components, middleware, config) — not from `package.json`/README alone. Regenerate or update sections here if the backend contract, routing, or major UI patterns change.*
