'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'
import FooterV2 from './FooterV2'
import { stripLocalePrefix } from '@/lib/utils'

import type { FooterData } from '@/lib/services/footer.service'
import type { FooterTranslations } from '@/lib/translations/footer'

interface ConditionalFooterProps {
  footerData: FooterData | null
  translations: FooterTranslations
}

export default function ConditionalFooter({ footerData, translations }: ConditionalFooterProps) {
  const pathname = usePathname()

  // Define routes where footer should be hidden
  // We check if the pathname contains /cart, /dashboard, or /checkout
  // Since these are usually top-level segments after the locale
  // Checkout in particular must not expose the footer's RegionToggle --
  // switching currency mid-checkout doesn't touch the cart/Stripe session
  // already in flight, so all currency decisions need to be made before
  // checkout is reached.
  const hideFooterRoutes = ['cart', 'dashboard', 'checkout']

  // English carries no locale prefix, every other locale does -- strip it if present so the
  // first real route segment lands in the same place regardless of locale.
  const segments = stripLocalePrefix(pathname).split('/')
  const firstRealSegment = segments[1]

  const shouldHide = hideFooterRoutes.includes(firstRealSegment)

  if (shouldHide) return null

  return footerData?.version === 'v2' ? (
    <FooterV2 footerData={footerData} translations={translations} />
  ) : (
    <Footer footerData={footerData} translations={translations} />
  )
}
