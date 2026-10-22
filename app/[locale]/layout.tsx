import type { Metadata } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
import '../globals.css'
import Navbar from '@/components/layout/Navbar'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import AttributionTracker from '@/components/AttributionTracker'
import { cn } from '@/lib/utils'
import MobileNav from '@/components/layout/MobileNav'
import GoogleSignInReturn from '@/components/auth/GoogleSignInReturn'
import { Toaster } from 'sonner'
import QueryProvider from '@/components/providers/QueryProvider'
import NextTopLoader from 'nextjs-toploader'
import { FooterService } from '@/lib/services/footer.service'
import { NavbarService } from '@/lib/services/navbar.service'
import ScrollToTop from '@/components/layout/ScrollToTop'
import ConditionalFooter from '@/components/layout/ConditionalFooter'
import {
  translateFooterData,
  getDefaultFooterTranslations,
} from '@/lib/translations/footer'
import { SITE_URL } from '@/lib/site'
import { organizationJsonLd, websiteJsonLd } from '@/lib/structured-data'

// The site font (Epic Games Store style type scale, see globals.css).
// latin-ext carries the rupee sign.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'optional', // Don't block render — mono is rarely visible on first paint
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Increddy: Buy Digital Goods Cheaper!',
  description:
    'Level up with the best deals on games, gift cards, subscriptions, and more with Increddy. Enjoy  lowest prices, and endless gaming fun!',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
}

// Preconnect links injected into <head> to warm up the CMS and CDN origins
// before the LCP hero image and product images are requested.
const CMS_ORIGIN = process.env.NEXT_PUBLIC_CMS_API_URL?.replace(/\/+$/, '') || 'https://cms.increddy.com'

// Organization + website on every page; page graphs refer to them by id (lib/structured-data.ts).
// The social profiles are the footer's (Directus), minus placeholders like "/".
function getSharedJsonLd(locale: string, social: { url?: string }[] = []) {
  const socialUrls = social.map((item) => item.url ?? '').filter((url) => /^https?:\/\//.test(url))
  return {
    '@context': 'https://schema.org',
    '@graph': [organizationJsonLd(socialUrls), websiteJsonLd(locale)],
  }
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  let footerData = await FooterService.getFooterData()
  const navbarData = await NavbarService.getNavbarData()

  let footerTranslations = getDefaultFooterTranslations()

  if (locale.toUpperCase() !== 'EN' && footerData) {
    try {
      const result = await translateFooterData(footerData, locale)
      footerData = result.footerData
      footerTranslations = result.translations
    } catch (error) {
      console.error('[RootLayout] Footer translation failed:', error)
    }
  }

  return (
    <html lang={locale} className="dark">
      {/* Preconnect to CMS and CDN origins to reduce LCP latency */}
      <head>
        <link rel="preconnect" href={CMS_ORIGIN} />
        <link rel="dns-prefetch" href={CMS_ORIGIN} />
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.shopify.com" />
      </head>
      <body className={cn(inter.variable, geistMono.variable)}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getSharedJsonLd(locale, footerData?.social)),
          }}
        />
        <QueryProvider>
          <NextTopLoader color="#2468DF" showSpinner={false} />
          <ScrollToTop />
          <Navbar navbarData={navbarData} />
          <main className="flex flex-col gap-24">{children}</main>
          <ConditionalFooter footerData={footerData} translations={footerTranslations} />
          <MobileNav />
          <Toaster position="top-center" />
          <GoogleSignInReturn />
        </QueryProvider>
        {process.env.NODE_ENV === 'production' &&
          process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
          )}
        <AttributionTracker />
      </body>
    </html>
  )
}
