import Link from 'next/link'
import { cn, localizedHref } from '@/lib/utils'
import {
  ACCOUNT_NAV_ACTIVE_CLASS,
  ACCOUNT_NAV_LINK_CLASS,
  ACCOUNT_SECTION_LABEL_CLASS,
} from '@/components/library/account-ui'

export type LegalNavPage = { slug: string; label: string }

// Desktop menu of the legal pages, in the account menu's style (phones get chips instead).
export default function LegalSidebar({
  locale,
  activeSlug,
  pages,
}: {
  locale: string
  activeSlug: string
  pages: LegalNavPage[]
}) {
  if (pages.length === 0) return null

  return (
    <aside className="hidden w-58 shrink-0 self-start lg:sticky lg:top-28 lg:block">
      <p className={cn(ACCOUNT_SECTION_LABEL_CLASS, 'mb-2 px-3.5 text-white/45')}>Legal</p>
      <nav aria-label="Legal pages" className="flex flex-col gap-0.5">
        {pages.map((page) => (
          <Link
            key={page.slug}
            href={localizedHref(locale, `/legal/${page.slug}`)}
            aria-current={page.slug === activeSlug ? 'page' : undefined}
            className={cn(ACCOUNT_NAV_LINK_CLASS, page.slug === activeSlug && ACCOUNT_NAV_ACTIVE_CLASS)}
          >
            {page.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
