import Link from 'next/link'
import { cn, localizedHref } from '@/lib/utils'
import {
  ACCOUNT_CARD_CLASS,
  ACCOUNT_PRIMARY_BUTTON_CLASS,
} from '@/components/library/account-ui'
import LegalSidebar, { type LegalNavPage } from './LegalSidebar'

interface LegalPageContentProps {
  locale: string
  activeSlug: string
  // The page's HTML from Directus (translated for other locales); its h1 is the page title.
  html: string
  pages: LegalNavPage[]
}

// The CMS HTML, styled to the account pages' type scale: title 32 px, sections 20 px (18 on
// phones), body 16 px (15) at 65% white, a ~75-character reading column. The CMS's dividers
// between sections are hidden; spacing separates them.
const LEGAL_HTML_CLASS = cn(
  'max-w-[720px] text-[15px] leading-[1.65] text-white/65 md:text-base',
  '[&_h1]:mb-6 [&_h1]:text-[28px] [&_h1]:leading-tight [&_h1]:font-bold [&_h1]:text-white/95 md:[&_h1]:text-[32px]',
  '[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white/95 md:[&_h2]:text-xl',
  '[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:leading-snug [&_h3]:font-bold [&_h3]:text-white/95 md:[&_h3]:mt-10 md:[&_h3]:text-xl',
  '[&_p]:mb-3.5 [&_ul]:mb-3.5 [&_ul]:list-disc [&_ul]:pl-5.5 [&_ol]:mb-3.5 [&_ol]:list-decimal [&_ol]:pl-5.5',
  '[&_li]:mb-1.5 [&_li]:marker:text-white/40',
  '[&_strong]:font-bold [&_strong]:text-white/95 [&_b]:text-white/95',
  '[&_a]:text-[#5B93F0] [&_a]:no-underline hover:[&_a]:underline',
  '[&_hr]:hidden',
)

export default function LegalPageContent({ locale, activeSlug, html, pages }: LegalPageContentProps) {
  return (
    <div className="container py-8 [--max-width-container:1280px] lg:py-16">
      <div className="flex gap-14">
        <LegalSidebar locale={locale} activeSlug={activeSlug} pages={pages} />

        <main className="min-w-0 flex-1">
          {/* Phones: the other legal pages as a row of chips (the sidebar is desktop only). */}
          {pages.length > 1 ? (
            <nav
              aria-label="Legal pages"
              className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden"
            >
              {pages.map((page) => (
                <Link
                  key={page.slug}
                  href={localizedHref(locale, `/legal/${page.slug}`)}
                  aria-current={page.slug === activeSlug ? 'page' : undefined}
                  className={cn(
                    'shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors',
                    page.slug === activeSlug
                      ? 'border-primary/50 bg-primary/15 text-white'
                      : 'bg-card border-border text-white/65 hover:text-white',
                  )}
                >
                  {page.label}
                </Link>
              ))}
            </nav>
          ) : null}

          <div className={LEGAL_HTML_CLASS} dangerouslySetInnerHTML={{ __html: html }} />

          <div
            className={cn(
              ACCOUNT_CARD_CLASS,
              'mt-12 flex max-w-[720px] flex-wrap items-center justify-between gap-4 px-5 py-4',
            )}
          >
            <div>
              <p className="text-[15px] font-bold text-white/95">Questions about this page?</p>
              <p className="text-sm text-white/65">Ask us on the Contact page and we will help.</p>
            </div>
            <Link href={localizedHref(locale, '/contact')} className={ACCOUNT_PRIMARY_BUTTON_CLASS}>
              Contact support
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
