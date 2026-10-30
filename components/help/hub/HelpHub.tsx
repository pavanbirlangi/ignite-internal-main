'use client'

import Link from 'next/link'
import { cn, localizedHref } from '@/lib/utils'
import {
  ACCOUNT_CARD_CLASS,
  ACCOUNT_SECONDARY_BUTTON_CLASS,
  ACCOUNT_SECTION_LABEL_CLASS,
} from '@/components/library/account-ui'
import { useUserStore } from '@/store/useUserStore'
import { useAuthModalStore } from '@/store/useAuthModalStore'
import { IssueIcon } from './issue-icons'
import RecentOrders from './RecentOrders'

export interface HubIssueType {
  slug: string
  name: string
  description: string
  href: string
}

interface HelpHubProps {
  locale: string
  title: string
  subtitle: string
  issueTypes: HubIssueType[]
}

// The Help Centre home: the customer's recent orders, the issue types, and the ways out
// (activation guides, the customer's tickets).
export default function HelpHub({ locale, title, subtitle, issueTypes }: HelpHubProps) {
  const user = useUserStore((s) => s.user)
  const openModal = useAuthModalStore((s) => s.openModal)
  const href = (path: string) => localizedHref(locale, path)

  return (
    <div className="container pt-6 pb-16 md:pt-8 md:pb-20">
      <h1 data-display className="text-2xl leading-tight font-bold text-white/95 md:text-3xl">{title}</h1>
      <p className="mt-2 text-base text-white/65">{subtitle}</p>

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
    </div>
  )
}
