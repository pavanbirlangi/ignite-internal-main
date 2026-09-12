'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'
import FooterV2 from './FooterV2'

import type { FooterData } from '@/lib/services/footer.service'
import type { FooterTranslations } from '@/lib/translations/footer'

interface ConditionalFooterProps {
  footerData: FooterData | null
  translations: FooterTranslations
}

export default function ConditionalFooter({ footerData, translations }: ConditionalFooterProps) {
  const pathname = usePathname()

  // Define routes where footer should be hidden
  // We check if the pathname contains /cart or /dashboard
  // Since these are usually top-level segments after the locale
  const hideFooterRoutes = ['cart', 'dashboard']
  
  const segments = pathname.split('/')
  // segments[0] is ""
  // segments[1] is the locale (e.g. "en", "en-US")
  // segments[2] is the first actual route segment
  const firstRealSegment = segments[2]
  
  const shouldHide = hideFooterRoutes.includes(firstRealSegment)

  if (shouldHide) return null

  return footerData?.version === 'v2' ? (
    <FooterV2 footerData={footerData} translations={translations} />
  ) : (
    <Footer footerData={footerData} translations={translations} />
  )
}
