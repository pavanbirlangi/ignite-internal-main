'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Search, X } from 'lucide-react'
import { cn, localizedHref } from '@/lib/utils'
import {
  ACCOUNT_CARD_CLASS,
  ACCOUNT_SECONDARY_BUTTON_CLASS,
  ACCOUNT_SECTION_LABEL_CLASS,
} from '@/components/library/account-ui'
import { useUserStore } from '@/store/useUserStore'
import { useAuthModalStore } from '@/store/useAuthModalStore'
import { ticketHref } from '@/lib/help/help-links'
import { IssueIcon } from './issue-icons'
import RecentOrders from './RecentOrders'

export interface HubIssueType {
  slug: string
  name: string
  description: string
  href: string
}

// One searchable entry: a topic, or an answer inside a topic (both open the topic's page).
export interface HubSearchEntry {
  title: string
  // Topic title for answers, the issue type for topics.
  context: string
  text: string
  href: string
}

interface HelpHubProps {
  locale: string
  title: string
  subtitle: string
  issueTypes: HubIssueType[]
  searchIndex: HubSearchEntry[]
}

const MAX_RESULTS = 8

// The Help Centre home: search, the customer's recent orders, the issue types, and the ways out
// (activation guides, the customer's tickets).
export default function HelpHub({ locale, title, subtitle, issueTypes, searchIndex }: HelpHubProps) {
  const user = useUserStore((s) => s.user)
  const openModal = useAuthModalStore((s) => s.openModal)
  const [query, setQuery] = useState('')
  const href = (path: string) => localizedHref(locale, path)

  const needle = query.trim().toLowerCase()
  const results = useMemo(
    () =>
      needle
        ? searchIndex
            .filter((entry) => `${entry.title} ${entry.context} ${entry.text}`.toLowerCase().includes(needle))
            .slice(0, MAX_RESULTS)
        : [],
    [needle, searchIndex],
  )

  return (
    <div className="container pt-6 pb-16 md:pt-8 md:pb-20">
      <h1 data-display className="text-2xl leading-tight font-bold text-white/95 md:text-3xl">{title}</h1>
      <p className="mt-2 text-base text-white/65">{subtitle}</p>

      <div className="relative mt-6 max-w-160">
        <Search className="pointer-events-none absolute top-1/2 left-4.5 size-4.5 -translate-y-1/2 text-white/45" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search help, e.g. "refund"'
          aria-label="Search help"
          className="bg-card border-border h-13 w-full rounded-xl border pr-11 pl-12 text-base text-white/95 transition-colors outline-none placeholder:text-white/45 hover:border-white/20 focus:border-primary/70 [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-white/55 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {needle ? (
        <section aria-label="Search results" className="mt-6 max-w-200">
          {results.length > 0 ? (
            <div className={cn(ACCOUNT_CARD_CLASS, 'overflow-hidden')}>
              {results.map((entry, i) => (
                <Link
                  key={`${entry.href}-${i}`}
                  href={href(entry.href)}
                  className="border-border flex items-center gap-3 border-b px-4.5 py-3.5 transition-colors last:border-b-0 hover:bg-white/3"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-base font-medium text-white/95">{entry.title}</span>
                    <span className="text-sm text-white/55">{entry.context}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-white/40" aria-hidden />
                </Link>
              ))}
            </div>
          ) : (
            <div className={cn(ACCOUNT_CARD_CLASS, 'px-5 py-6')}>
              <p className="text-base text-white/95">Nothing matches &quot;{query.trim()}&quot;.</p>
              <p className="mt-1 text-sm text-white/65">
                Try other words, or{' '}
                <Link href={href(ticketHref())} className="text-[#5B93F0] hover:underline">
                  send us a ticket
                </Link>
                .
              </p>
            </div>
          )}
        </section>
      ) : (
        <>
          <RecentOrders locale={locale} />

          <section aria-labelledby="help-topics" className="mt-10">
            <h2 id="help-topics" data-display className={cn(ACCOUNT_SECTION_LABEL_CLASS, 'mb-3')}>
              Browse by topic
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {issueTypes.map((type) => (
                <Link
                  key={type.slug}
                  href={href(type.href)}
                  className={cn(
                    ACCOUNT_CARD_CLASS,
                    'flex flex-col p-4 transition-colors hover:border-white/20 md:p-5',
                  )}
                >
                  <span className="bg-primary/16 mb-3 flex size-10 items-center justify-center rounded-lg text-[#7DB0FF]">
                    <IssueIcon slug={type.slug} className="size-5" />
                  </span>
                  <span className="text-base font-bold text-white/95">{type.name}</span>
                  {type.description ? (
                    <span className="mt-1 text-sm text-white/60">{type.description}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className={cn(ACCOUNT_CARD_CLASS, 'p-5')}>
              <p className="text-base font-bold text-white/95">Activation guides</p>
              <p className="mt-1 mb-4 text-sm text-white/65">
                Step by step for each platform: Steam, EA, Ubisoft, Rockstar and gift cards.
              </p>
              <Link href={href('/activation-guides')} className={ACCOUNT_SECONDARY_BUTTON_CLASS}>
                Open guides
              </Link>
            </div>
            <div className={cn(ACCOUNT_CARD_CLASS, 'p-5')}>
              <p className="text-base font-bold text-white/95">My tickets</p>
              <p className="mt-1 mb-4 text-sm text-white/65">
                {user
                  ? 'Your tickets and our replies. Replies also arrive by email.'
                  : 'Sign in to see your tickets and our replies.'}
              </p>
              {user ? (
                <Link href={href('/dashboard/my-tickets')} className={ACCOUNT_SECONDARY_BUTTON_CLASS}>
                  View my tickets
                </Link>
              ) : (
                <button type="button" onClick={() => openModal('login')} className={ACCOUNT_SECONDARY_BUTTON_CLASS}>
                  Sign in
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
