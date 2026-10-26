'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ChevronRight, Search, X } from 'lucide-react'
import { cn, localizedHref } from '@/lib/utils'
import {
  ACCOUNT_CARD_CLASS,
  ACCOUNT_PRIMARY_BUTTON_CLASS,
  ACCOUNT_SECTION_LABEL_CLASS,
} from '@/components/library/account-ui'
import type { GuideSummary } from '@/lib/services/help.service'
import type { ActivationGuidesLabels } from '@/lib/translations/activation-guides'
import { groupGuides, guideImageUrl } from './guide-groups'
import GuidesBreadcrumb from './GuidesBreadcrumb'

export interface HelpLink {
  name: string
  href: string
}

interface ActivationGuidesPageProps {
  locale: string
  labels: ActivationGuidesLabels
  guides: GuideSummary[]
  helpLinks: HelpLink[]
  // From ?category= (the guide page's breadcrumb links here with it).
  initialCategory?: string
}

const ALL = 'all'

// Phones get the short search placeholder (the long one is cut off at 390 px).
const NARROW_QUERY = '(max-width: 639px)'
function useNarrowScreen() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(NARROW_QUERY)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  )
}

function chipClass(active: boolean) {
  return cn(
    'flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/40',
    active
      ? 'border-primary/50 bg-primary/15 text-white'
      : 'bg-card border-border text-white/75 hover:border-white/20 hover:text-white',
  )
}

function GuideRow({ guide, locale, letter }: { guide: GuideSummary; locale: string; letter: string }) {
  const image = guideImageUrl(guide.image)
  return (
    <Link
      href={localizedHref(locale, `/activation-guides/${guide.slug}`)}
      className="border-border flex items-center gap-3.5 border-b px-4 py-3.5 transition-colors outline-none last:border-b-0 hover:bg-white/3 focus-visible:bg-white/5 md:px-4.5"
    >
      <span className="bg-secondary flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg text-base font-bold text-white/70">
        {image ? <img src={image} alt="" className="size-full object-cover" loading="lazy" /> : letter}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-base font-medium text-white/95">{guide.title}</span>
        {guide.description ? (
          <span className="line-clamp-2 text-sm text-white/55">{guide.description}</span>
        ) : null}
      </span>
      <ChevronRight className="size-4 shrink-0 text-white/40" aria-hidden />
    </Link>
  )
}

// Activation guides as a knowledge base: search, category chips with counts, guides as rows grouped
// by category (images optional), and a side column with the ticket box and Help Centre links.
export default function ActivationGuidesPage({
  locale,
  labels,
  guides,
  helpLinks,
  initialCategory,
}: ActivationGuidesPageProps) {
  const groups = useMemo(() => groupGuides(guides, labels.other), [guides, labels.other])
  const narrow = useNarrowScreen()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(
    initialCategory && groups.some((g) => g.slug === initialCategory) ? initialCategory : ALL,
  )

  const pickCategory = (slug: string) => {
    setCategory(slug)
    // Keep the choice in the address (shareable, survives back) without a navigation.
    const url = new URL(window.location.href)
    if (slug === ALL) url.searchParams.delete('category')
    else url.searchParams.set('category', slug)
    window.history.replaceState(window.history.state, '', url)
  }

  const needle = query.trim().toLowerCase()
  const shown = groups
    .filter((group) => category === ALL || group.slug === category)
    .map((group) => ({
      ...group,
      guides: needle
        ? group.guides.filter((g) =>
            [g.title, g.description, group.name].some((text) => text?.toLowerCase().includes(needle)),
          )
        : group.guides,
    }))
    .filter((group) => group.guides.length > 0)

  // One group (no categories set yet) needs neither chips nor a section heading.
  const grouped = groups.length > 1

  return (
    <div className="container pt-6 pb-16 md:pt-8 md:pb-24">
      <GuidesBreadcrumb locale={locale} items={[{ name: labels.helpCentre, path: '/help' }, { name: labels.pageTitle }]} />

      <h1 data-display className="mt-3.5 text-2xl leading-tight font-bold text-white/95 md:text-3xl">{labels.pageTitle}</h1>
      <p className="mt-2 text-base text-white/65">{labels.subtitle}</p>

      <div className="relative mt-6 max-w-160">
        <Search className="pointer-events-none absolute top-1/2 left-4.5 size-4.5 -translate-y-1/2 text-white/45" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={narrow ? labels.searchPlaceholderShort : labels.searchPlaceholder}
          aria-label={labels.searchPlaceholderShort}
          className="bg-card border-border h-13 w-full rounded-xl border pr-11 pl-12 text-base text-white/95 transition-colors outline-none placeholder:text-white/45 hover:border-white/20 focus:border-primary/70 [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={labels.clearSearch}
            className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-white/55 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {grouped ? (
        <nav
          aria-label={labels.pageTitle}
          className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          {[{ slug: ALL, name: labels.all, count: guides.length }, ...groups.map((g) => ({ slug: g.slug, name: g.name, count: g.guides.length }))].map(
            (chip) => (
              <button
                key={chip.slug}
                type="button"
                onClick={() => pickCategory(chip.slug)}
                aria-pressed={category === chip.slug}
                className={chipClass(category === chip.slug)}
              >
                {chip.name}
                <span className="text-xs text-white/45">{chip.count}</span>
              </button>
            ),
          )}
        </nav>
      ) : null}

      <div className="mt-7 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
        <div className="flex flex-col gap-7">
          {shown.length === 0 ? (
            <p className={cn(ACCOUNT_CARD_CLASS, 'px-5 py-8 text-center text-base text-white/65')}>
              {labels.noResults.replace('{query}', query.trim())}
            </p>
          ) : (
            shown.map((group) => (
              <section key={group.slug} aria-label={group.name}>
                {grouped ? <h2 data-display className={cn(ACCOUNT_SECTION_LABEL_CLASS, 'mb-2.5')}>{group.name}</h2> : null}
                <div className={cn(ACCOUNT_CARD_CLASS, 'overflow-hidden')}>
                  {group.guides.map((guide) => (
                    <GuideRow
                      key={guide.slug}
                      guide={guide}
                      locale={locale}
                      letter={(guide.category?.name || guide.title).charAt(0).toUpperCase()}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className={cn(ACCOUNT_CARD_CLASS, 'p-5')}>
            <p className="text-base font-bold text-white/95">{labels.helpBoxTitle}</p>
            <p className="mt-1 mb-4 text-sm text-white/65">{labels.helpBoxText}</p>
            <Link href={localizedHref(locale, '/help/create-ticket')} className={ACCOUNT_PRIMARY_BUTTON_CLASS}>
              {labels.createTicket}
            </Link>
          </div>
          {helpLinks.length > 0 ? (
            <div className={cn(ACCOUNT_CARD_CLASS, 'p-5')}>
              <p className="mb-1.5 text-base font-bold text-white/95">{labels.moreHelp}</p>
              <ul>
                {helpLinks.map((link) => (
                  <li key={link.href} className="border-border border-b last:border-b-0">
                    <Link href={link.href} className="block py-2.5 text-sm text-white/80 transition-colors hover:text-white">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
