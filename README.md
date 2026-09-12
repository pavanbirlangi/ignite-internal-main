# Increddy (increddy.com)

A modern e-commerce storefront for digital game keys, built with **Next.js 16** and **React 19**. Features locale-aware routing, a Shopify-backed product catalog, cart management, user authentication (including OAuth), and a rich help center.

---

## Tech Stack

| Layer            | Technology                                          |
| ---------------- | --------------------------------------------------- |
| Framework        | [Next.js 16](https://nextjs.org/) (App Router)      |
| UI               | [React 19](https://react.dev/), TypeScript 5        |
| Styling          | [Tailwind CSS v4](https://tailwindcss.com/)          |
| Components       | [Radix UI](https://www.radix-ui.com/), [shadcn/ui](https://ui.shadcn.com/) |
| State Management | [Zustand](https://zustand.docs.pmnd.rs/)             |
| Data Fetching    | [TanStack Query](https://tanstack.com/query)         |
| HTTP Client      | [Axios](https://axios-http.com/)                     |
| Forms            | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Carousel         | [Embla Carousel](https://www.embla-carousel.com/)    |
| Icons            | [Lucide React](https://lucide.dev/)                  |
| Notifications    | [Sonner](https://sonner.emilkowal.dev/)              |
| Linting          | ESLint 9, Prettier                                   |

---

## Project Structure

```
increddy-frontend/
├── app/
│   ├── globals.css              # Global styles & CSS variables
│   └── [locale]/                # Locale-prefixed routes (i18n)
│       ├── page.tsx             # Home page
│       ├── layout.tsx           # Root layout (navbar, footer, providers)
│       ├── store/               # Store / browse page
│       ├── cart/                 # Cart page
│       ├── categories/          # Category listing
│       ├── (product)/           # Product route group
│       ├── [slug]/              # Dynamic product detail
│       ├── dashboard/           # User dashboard (orders, library, profile, tickets)
│       ├── help/                # Help center & FAQs
│       ├── contact/             # Contact page
│       └── activation-guides/   # Game activation guides
├── components/
│   ├── auth/                    # Login, signup, OAuth modals
│   ├── cart/                    # Cart drawer, items, summary
│   ├── home/                    # Hero section, featured products, genres
│   ├── product/                 # Product cards, detail, gallery
│   ├── store/                   # Filters, grid, sort controls
│   ├── orders/                  # Order history & details
│   ├── library/                 # User game library
│   ├── help/                    # Help center components
│   ├── legal/                   # Privacy, terms, refund pages
│   ├── contact/                 # Contact form
│   ├── tickets/                 # Support tickets
│   ├── profile/                 # User profile
│   ├── layout/                  # Navbar, footer, mobile nav, sidebar
│   ├── icons/                   # Custom SVG icon components
│   ├── providers/               # React Query & global providers
│   ├── shared/                  # Reusable shared components
│   └── ui/                      # shadcn/ui primitives (button, dialog, etc.)
├── hooks/                       # Custom React hooks
│   ├── useProducts.ts           # Product data fetching
│   ├── useCategories.ts         # Category data fetching
│   ├── usePlatforms.ts          # Platform data fetching
│   ├── useDebounce.ts           # Debounce utility hook
│   ├── useLegalPage.ts          # Legal page content
│   ├── useContactUs.ts          # Contact form submission
│   └── useActivationGuides.ts   # Activation guide data
├── lib/
│   ├── axios.ts                 # Axios instance (API)
│   ├── cms-axios.ts             # Axios instance (CMS)
│   ├── region-data.ts           # Country/currency/language defaults
│   ├── utils.ts                 # Utility functions (cn, etc.)
│   └── services/                # API service modules
│       ├── auth.service.ts
│       ├── cart.service.ts
│       ├── category.service.ts
│       ├── product.service.ts
│       ├── platform.service.ts
│       ├── help.service.ts
│       └── legal.service.ts
├── store/                       # Zustand state stores
│   ├── useAuthModalStore.ts     # Auth modal open/close state
│   ├── useCartStore.ts          # Cart items & operations
│   ├── useStoreFilters.ts       # Product filtering & sorting
│   └── useUserStore.ts          # Authenticated user state
├── types/                       # TypeScript type definitions
│   ├── product.ts
│   └── game.ts
├── data/                        # Static data / fixtures
├── public/                      # Static assets (images, fonts, favicon)
├── proxy.ts                     # Next.js proxy (i18n redirect & region cookies)
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
├── eslint.config.mjs            # ESLint configuration
├── postcss.config.mjs           # PostCSS configuration
└── .prettierrc.json             # Prettier configuration
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.18
- **npm** (ships with Node)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd increddy-frontend

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
NEXT_PUBLIC_API_BASE_URL=<backend-api-url>
NEXT_PUBLIC_CMS_API_BASE_URL=<cms-api-url>
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app will auto-redirect to a locale-prefixed route (e.g. `/en`).

### Production Build

```bash
npm run build
npm start
```

---

## Available Scripts

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `npm run dev`      | Start the development server       |
| `npm run build`    | Create an optimized production build |
| `npm start`        | Serve the production build         |
| `npm run lint`     | Run ESLint                         |
| `npm run format`   | Format code with Prettier          |

---

## Key Features

- **Internationalization (i18n)** — Locale-prefixed routing with auto-detection via Vercel edge headers and cookie persistence.
- **Product Catalog** — Filterable, searchable product grid powered by Shopify CDN images.
- **Cart Management** — Persistent cart with Zustand, synced to the backend API.
- **Authentication** — Email/password and OAuth login flows with token-based sessions.
- **User Dashboard** — Order history, game library, support tickets, and profile management.
- **Help Center** — FAQ sections and activation guides with CMS-driven content.
- **Legal Pages** — Privacy policy, terms of service, and refund policy with sidebar navigation.
- **Responsive Design** — Mobile-first layout with a dedicated bottom navigation bar and mobile header.

---

## Deployment

The app is configured for deployment on [Vercel](https://vercel.com). Push to `main` to trigger an automatic deploy.

For manual deployment:

```bash
npm run build
# Deploy the .next/ output to your hosting provider
```

---

## License

This project is proprietary. All rights reserved.
