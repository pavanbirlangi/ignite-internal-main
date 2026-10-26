'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { cn, localizedHref } from '@/lib/utils'
import {
  ACCOUNT_CARD_CLASS,
  ACCOUNT_PRIMARY_BUTTON_CLASS,
  ACCOUNT_SECONDARY_BUTTON_CLASS,
} from '@/components/library/account-ui'
import type { HelpArticle } from '@/lib/services/help.service'

const ANSWER_HTML_CLASS =
  'text-base leading-[1.65] text-white/75 [&_p]:mb-2.5 [&_a]:text-[#5B93F0] hover:[&_a]:underline [&_strong]:text-white/95'

// A topic's answers as an accordion (the first one open), then "Did this solve it?" with the
// ticket that carries this topic along.
export default function HelpAnswers({
  locale,
  articles,
  ticketPath,
}: {
  locale: string
  articles: HelpArticle[]
  ticketPath: string
}) {
  const [open, setOpen] = useState<string | null>(articles[0]?.id ?? null)
  const [solved, setSolved] = useState(false)

  return (
    <>
      {articles.length > 0 ? (
        <div className={cn(ACCOUNT_CARD_CLASS, 'overflow-hidden')}>
          {articles.map((article, index) => {
            const isOpen = open === article.id
            return (
              <div key={article.id} className="border-border border-b last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : article.id)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-start gap-3 px-4.5 py-4 text-left transition-colors hover:bg-white/3"
                >
                  <span className="text-base font-medium text-white/45">{index + 1}.</span>
                  <span className="flex-1 text-base font-bold text-white/95">{article.title}</span>
                  <ChevronDown
                    className={cn('mt-0.5 size-4.5 shrink-0 text-white/55 transition-transform', isOpen && 'rotate-180')}
                    aria-hidden
                  />
                </button>
                {isOpen ? (
                  <div className="pr-4.5 pb-5 pl-11">
                    {article.body ? (
                      <div className={ANSWER_HTML_CLASS} dangerouslySetInnerHTML={{ __html: article.body }} />
                    ) : null}
                    {article.cta_label?.trim() && article.cta_url ? (
                      <Link
                        href={/^https?:/.test(article.cta_url) ? article.cta_url : localizedHref(locale, article.cta_url)}
                        className={cn(ACCOUNT_SECONDARY_BUTTON_CLASS, 'mt-2')}
                      >
                        {article.cta_label.trim()}
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}

      <div className={cn(ACCOUNT_CARD_CLASS, 'mt-5 flex flex-wrap items-center justify-between gap-4 px-5 py-4')}>
        {solved ? (
          <p className="text-base text-white/95">Glad that sorted it.</p>
        ) : (
          <>
            <div>
              <p className="text-base font-bold text-white/95">Did this solve it?</p>
              <p className="text-sm text-white/65">If not, send us a ticket: this topic comes along.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSolved(true)} className={ACCOUNT_SECONDARY_BUTTON_CLASS}>
                Yes, thanks
              </button>
              <Link href={localizedHref(locale, ticketPath)} className={ACCOUNT_PRIMARY_BUTTON_CLASS}>
                No, create a ticket
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}
