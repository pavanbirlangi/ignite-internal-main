import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '../globals.css'
import Navbar from '@/components/layout/Navbar'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { cn } from '@/lib/utils'
import MobileNav from '@/components/layout/MobileNav'
import { Toaster } from 'sonner'
import QueryProvider from '@/components/providers/QueryProvider'
import { OAuthCallbackHandler } from '@/components/auth/OAuthCallbackHandler'
import NextTopLoader from 'nextjs-toploader'
import { FooterService } from '@/lib/services/footer.service'
import { NavbarService } from '@/lib/services/navbar.service'
import ScrollToTop from '@/components/layout/ScrollToTop'
import ConditionalFooter from '@/components/layout/ConditionalFooter'
import {
  translateFooterData,
  getDefaultFooterTranslations,
} from '@/lib/translations/footer'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'optional', // Don't block render — mono is rarely visible on first paint
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://increddy.com',
  ),
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

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ||
    'https://increddy.com'
  )
}

function getSharedJsonLd(locale: string) {
  const baseUrl = getBaseUrl()
  const normalizedLocale = locale.toLowerCase()

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'Increddy',
        url: baseUrl,
        logo: `${baseUrl}/icon.png`,
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: `${baseUrl}/${normalizedLocale}`,
        name: 'Increddy',
        inLanguage: normalizedLocale,
        publisher: {
          '@id': `${baseUrl}/#organization`,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/${normalizedLocale}/store?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
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
      <body className={cn(geistSans.variable, geistMono.variable)}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getSharedJsonLd(locale)),
          }}
        />
        <QueryProvider>
          <NextTopLoader color="#2468DF" showSpinner={false} />
          <ScrollToTop />
          <OAuthCallbackHandler />
          <Navbar navbarData={navbarData} />
          <main className="flex flex-col gap-24">{children}</main>
          <ConditionalFooter footerData={footerData} translations={footerTranslations} />
          <MobileNav />
          <Toaster richColors position="top-center" />
        </QueryProvider>
        {process.env.NODE_ENV === 'production' &&
          process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
          )}
      </body>
    </html>
  )
}
