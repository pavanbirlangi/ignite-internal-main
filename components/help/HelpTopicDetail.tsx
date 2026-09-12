'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { HelpArticle } from '@/lib/services/help.service'
import StillExperiencingIssues from './StillExperiencingIssues'

interface HelpTopicDetailProps {
  title: string
  description?: string
  articles: HelpArticle[]
  onBack: () => void
  onCreateTicket: () => void
}

export function HelpTopicDetail({
  title,
  description,
  articles,
  onBack,
  onCreateTicket,
}: HelpTopicDetailProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    articles.length > 0 ? articles[0].id : null
  )

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="mx-auto flex w-full max-w-[780px] flex-col gap-6">
      {/* Main Card */}
      <div className="border-border bg-secondary/40 rounded-[20px] border p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={onBack}
            className="hover:text-muted-foreground cursor-pointer text-white transition-colors"
            aria-label="Go back"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white md:text-[28px]">
              {title}
            </h1>
            {description && (
              <p className="text-muted-foreground mt-1 text-sm">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Article Items */}
        {articles.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted-foreground text-sm font-medium">
              No articles found for this topic.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {articles.map((article: HelpArticle, index: number) => {
              const isExpanded = expandedId === article.id
              return (
                <div
                  key={article.id}
                  className="bg-secondary rounded-[6px] transition-colors"
                >
                  {/* Collapsed header — always visible */}
                  <button
                    onClick={() => toggleExpand(article.id)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 text-sm font-medium text-white">
                        {index + 1}.
                      </span>
                      <h3 className="text-sm font-semibold text-white md:text-[18px]">
                        {article.title}
                      </h3>
                    </div>
                    <ChevronRight
                      className={`size-5 shrink-0 text-white transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {/* Expanded content — body + CTA */}
                  {isExpanded && (
                    <div className="px-5 pt-3 pb-5 pl-12">
                      {article.body && (
                        <div
                          dangerouslySetInnerHTML={{ __html: article.body }}
                          className="text-muted-foreground text-xs leading-relaxed font-medium [&_p]:m-0"
                        />
                      )}
                      {article.cta_label && article.cta_url && (
                        <Link
                          href={article.cta_url}
                          className="border-muted-foreground bg-background text-foreground mt-3 inline-block rounded-[6px] border px-4 py-2 text-xs font-medium transition-colors hover:bg-white/5"
                        >
                          {article.cta_label}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Still Experiencing Issues CTA */}
      <StillExperiencingIssues onCreateTicket={onCreateTicket} />
    </div>
  )
}
