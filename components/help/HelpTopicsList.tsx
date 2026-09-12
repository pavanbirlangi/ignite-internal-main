'use client'

import { ChevronRight } from 'lucide-react'
import type { HelpTopic } from '@/lib/services/help.service'
import StillExperiencingIssues from './StillExperiencingIssues'

interface HelpTopicsListProps {
  topics: HelpTopic[]
  title: string
  onBack: () => void
  onSelectTopic: (topic: HelpTopic) => void
  onCreateTicket: () => void
}

export function HelpTopicsList({
  topics,
  title,
  onBack,
  onSelectTopic,
  onCreateTicket,
}: HelpTopicsListProps) {
  return (
    <div className="mx-auto flex w-full max-w-[780px] flex-col gap-6">
      <div className="border-border bg-secondary/40 rounded-[20px] border p-6 md:p-10">
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
          <h1 className="text-xl font-semibold text-white md:text-[28px]">
            {title}
          </h1>
        </div>

        {/* Topic Items */}
        <div className="flex flex-col gap-3">
          {topics.map((topic: HelpTopic, index: number) => (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic)}
              className="bg-secondary hover:bg-secondary/60 flex cursor-pointer items-center justify-between gap-4 rounded-[6px] px-8 py-6 text-left transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-white mt-0.5 shrink-0 text-sm font-medium">
                  {index + 1}.
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white md:text-[18px]">
                    {topic.title}
                  </h3>
                  <p className="text-muted-foreground font-medium mt-0.5 text-xs">
                    {topic.description}
                  </p>
                </div>
              </div>
              <ChevronRight className="text-white size-5 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      <StillExperiencingIssues onCreateTicket={onCreateTicket} />
    </div>
  )
}
