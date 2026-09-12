'use client'

import { useMemo } from 'react'
import { GuideDetail } from '@/lib/services/help.service'
import { useActivationGuideDetail } from '@/hooks/useActivationGuides'
import cmsClient from '@/lib/cms-axios'
import GuideCard, { GuideCardProps } from './GuideCard'
import styles from './GuideContent.module.css'
import { notFound } from 'next/navigation'

interface ActivationGuideDetailProps {
  id: string // slug from the URL
  translatedContent?: GuideDetail
}

const CMS_BASE_URL = cmsClient.defaults.baseURL || ''

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 30) return `${diffDays} days ago`
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths === 1) return '1 month ago'
  if (diffMonths < 12) return `${diffMonths} months ago`
  const diffYears = Math.floor(diffMonths / 12)
  return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`
}

// Skeleton placeholder
function DetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col pb-16 md:pb-24">
      <div className="container [--max-width-container:1280px]">
        <article className="mx-auto flex w-full max-w-[1120px] flex-col gap-[72px]">
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-[48px]">
              <div className="bg-muted/30 h-12 w-3/4 rounded" />
              <div className="space-y-3">
                <div className="bg-muted/20 h-4 w-full rounded" />
                <div className="bg-muted/20 h-4 w-5/6 rounded" />
                <div className="bg-muted/20 h-4 w-4/6 rounded" />
              </div>
            </div>
            <div className="bg-muted/30 relative aspect-[16/9] w-full rounded-[12px]" />
          </div>
          <div className="space-y-4">
            <div className="bg-muted/30 h-6 w-1/3 rounded" />
            <div className="bg-muted/20 h-4 w-full rounded" />
            <div className="bg-muted/20 h-4 w-full rounded" />
          </div>
        </article>
      </div>
    </div>
  )
}

export default function ActivationGuideDetail({
  id,
  translatedContent,
}: ActivationGuideDetailProps) {
  const { data: response, isLoading } = useActivationGuideDetail(id)

  const guide: GuideDetail | null = useMemo(() => {
    if (translatedContent) return translatedContent
    if (!response?.data?.length) return null
    return response.data[0]
  }, [response, translatedContent])

  const relatedGuides: GuideCardProps[] = useMemo(() => {
    if (!guide?.related_guides) return []
    return guide.related_guides.map((item, index) => {
      const g = item.related_guides_id
      return {
        id: String(index + 1),
        title: g.title,
        date: formatDate(g.published_date),
        image: `${CMS_BASE_URL}/assets/${g.image}`,
        href: `/activation-guides/${g.slug}`,
      }
    })
  }, [guide])

  if (!translatedContent && isLoading) return <DetailSkeleton />

  if (!guide) {
    notFound()
  }

  return (
    <div className="flex flex-col pt-8 pb-16 md:pt-15 md:pb-24">
      <div className="container [--max-width-container:1280px]">
        <article className="mx-auto flex w-full max-w-[1120px] flex-col gap-[72px]">
          {/* Intro Block: Title + Description + Banner */}
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-[48px]">
              {/* Title */}
              <h1 className="text-[40px] leading-tight font-semibold text-white capitalize">
                {guide.title}
              </h1>

              {/* Description */}
              <p className="text-[16px] leading-[24px] text-white">
                {guide.description}
              </p>
            </div>

            {/* Hero Banner */}
            <div className="bg-secondary relative aspect-[16/9] w-full overflow-hidden rounded-[12px]">
              <img
                src={`${CMS_BASE_URL}/assets/${guide.image}`}
                alt={guide.title}
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            </div>
          </div>

          {/* Rich HTML Content */}
          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: guide.content }}
          />

          {/* Tags + Author Row */}
          <div className="flex flex-col gap-6">
            {/* Tags */}
            {guide.tags?.length > 0 && (
              <div className="border-secondary flex flex-col gap-3 border-t pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  {guide.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-secondary inline-flex cursor-default items-center justify-center rounded-[6px] p-4  text-[14px] font-medium text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Author Row */}
            <div className="border-secondary flex flex-col items-start gap-4 border-t border-b py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {guide.author_profile ? (
                  <div className="border-border relative h-14 w-14 shrink-0 overflow-hidden rounded-full border bg-[var(--neutral-200)]">
                    <img
                      src={`${CMS_BASE_URL}/assets/${guide.author_profile}`}
                      alt={guide.author_name ?? 'Author'}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-secondary flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold text-white">
                    {(guide.author_name?.[0] ?? 'A').toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-[12px] leading-[20px] capitalize">
                    written by
                  </span>
                  <span className="text-[16px] leading-[20px] font-semibold text-white capitalize">
                    {guide.author_name}
                  </span>
                </div>
              </div>
              <span className="text-muted-foreground text-[16px] leading-[20px] font-medium capitalize">
                {guide.date_updated
                  ? `Last Updated ${timeAgo(guide.date_updated)}`
                  : formatDate(guide.published_date)}
              </span>
            </div>
          </div>
        </article>
      </div>

      {/* Read Next */}
      {relatedGuides.length > 0 && (
        <div className="container mt-20 [--max-width-container:1280px] md:mt-28">
          <h2 className="mb-8 text-2xl md:text-[32px] font-semibold text-white capitalize">
            Read Next
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedGuides.map((guide) => (
              <GuideCard key={guide.id} {...guide} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
