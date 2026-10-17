'use client'

import { useLegalPage } from '@/hooks/useLegalPage'
import LegalSidebar from './LegalSidebar'
import { LegalPage } from '@/lib/services/legal.service'

interface LegalPageContentProps {
  slug: string
  translatedContent?: LegalPage
  translatedSidebarLabels?: Record<string, string>
}

export default function LegalPageContent({
  slug,
  translatedContent,
  translatedSidebarLabels,
}: LegalPageContentProps) {
  const { data: response, isLoading } = useLegalPage(slug)
  const page = translatedContent || response?.data?.[0]

  if (!translatedContent && isLoading) {
    return (
      <div className="container py-12 [--max-width-container:1280px] lg:py-20">
        <div className="flex gap-16">
          {/* Sidebar skeleton */}
          <aside className="hidden w-[200px] shrink-0 flex-col gap-2 pt-2 lg:flex">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-muted/20 h-10 w-full animate-pulse rounded-[8px]"
              />
            ))}
          </aside>

          {/* Content skeleton */}
          <div className="min-w-0 flex-1 space-y-6">
            <div className="bg-muted/30 h-10 w-2/3 rounded" />
            <div className="bg-secondary h-px w-full" />
            <div className="space-y-4 pt-4">
              <div className="bg-muted/20 h-4 w-full rounded" />
              <div className="bg-muted/20 h-4 w-5/6 rounded" />
              <div className="bg-muted/20 h-4 w-4/6 rounded" />
              <div className="bg-muted/20 h-4 w-full rounded" />
              <div className="bg-muted/30 mt-10 h-6 w-56 rounded" />
              <div className="bg-muted/20 h-4 w-full rounded" />
              <div className="bg-muted/20 h-4 w-5/6 rounded" />
              <div className="bg-muted/30 mt-10 h-6 w-56 rounded" />
              <div className="bg-muted/20 h-4 w-full rounded" />
              <div className="bg-muted/20 h-4 w-5/6 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="container py-12 [--max-width-container:1280px] lg:py-20">
        <div className="flex gap-16">
          <LegalSidebar translatedLabels={translatedSidebarLabels} />
          <div className="flex min-h-[50vh] min-w-0 flex-1 flex-col items-center justify-center text-center">
            <h1 className="mb-3 text-2xl md:text-3xl font-bold text-white/95">
              Page Not Found
            </h1>
            <p className="text-white/65 text-base">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12 [--max-width-container:1280px] lg:py-20">
      <div className="flex gap-16">
        {/* Left sidebar */}
        <LegalSidebar translatedLabels={translatedSidebarLabels} />

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div
            className="legal-content prose prose-invert prose-h1:text-3xl prose-h1:font-bold prose-h1:text-white prose-h1:mb-4 md:prose-h1:text-3xl prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:text-white prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl md:prose-h3:text-3xl prose-h3:font-bold prose-h3:text-white prose-h3:mt-8 prose-h3:mb-3 prose-p:text-sm md:prose-p:text-base prose-p:text-muted-foreground prose-p:mb-4 prose-ul:text-sm md:prose-ul:text-base prose-ul:text-muted-foreground prose-ul:my-4 prose-ul:pl-5 prose-ol:text-sm md:prose-ol:text-base prose-ol:text-muted-foreground prose-ol:my-4 prose-ol:pl-5 prose-li:text-muted-foreground prose-li:marker:text-muted-foreground prose-li:mb-1 prose-strong:text-white prose-strong:font-bold prose-a:text-primary hover:prose-a:underline prose-hr:border-secondary prose-hr:my-8 w-full max-w-none"
            dangerouslySetInnerHTML={{ __html: page.page_content }}
          />
        </div>
      </div>
    </div>
  )
}
