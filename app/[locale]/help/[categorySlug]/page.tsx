import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import GuidesBreadcrumb from '@/components/help/activation-guides/GuidesBreadcrumb'
import { ACCOUNT_CARD_CLASS } from '@/components/library/account-ui'
import { HelpService } from '@/lib/services/help.service'
import { ticketHref, topicHref } from '@/lib/help/help-links'
import { cn, localizedHref } from '@/lib/utils'
import { getWebPageJsonLd } from '@/lib/seo'

interface CategoryPageProps {
  params: Promise<{ locale: string; categorySlug: string }>
}

async function getCategory(categorySlug: string) {
  const [help, topics] = await Promise.all([
    HelpService.getHelpItems().then((r) => r?.data ?? null),
    HelpService.getAllHelpTopics().then((r) => r?.data ?? []),
  ])
  const type = help?.issue_types
    ?.map((item) => item.help_issues_types_id)
    .find((t) => t?.slug === categorySlug && t.status === 'published')
  const inCategory = topics.filter((topic) => topic.issue_type?.slug === categorySlug)
  return { type, topics: inCategory }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params
  const { type } = await getCategory(categorySlug).catch(() => ({ type: undefined }))
  return {
    title: type ? `${type.name} | Help Centre | Increddy` : 'Help Centre | Increddy',
    description: type?.description || 'Browse support topics in this help category.',
  }
}

// One issue type's topics. "Other"-style topics (a redirect in Directus) and the closing
// "Something else" row both lead to a ticket; an unknown issue type is a real 404.
export default async function CategoryPageRoute({ params }: CategoryPageProps) {
  const { locale, categorySlug } = await params
  const { type, topics } = await getCategory(categorySlug)
  if (!type) notFound()

  const href = (path: string) => localizedHref(locale, path)
  const answered = topics.filter((topic) => !topic.redirect)
  const somethingElseHref = ticketHref({ global: Boolean(type.create_ticket_global) })

  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: `help/${categorySlug}`,
    name: `${type.name} | Help Centre | Increddy`,
    description: type.description || 'Browse support topics in this help category.',
    breadcrumbs: [{ name: 'Help Centre', path: '/help' }, { name: type.name }],
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <div className="container pt-6 pb-16 md:pt-8 md:pb-20">
        <GuidesBreadcrumb locale={locale} items={[{ name: 'Help Centre', path: '/help' }, { name: type.name }]} />
        <h1 data-display className="mt-3.5 text-2xl leading-tight font-bold text-white/95 md:text-3xl">{type.name}</h1>
        <p className="mt-2 text-base text-white/65">Choose the problem closest to yours.</p>

        <div className={cn(ACCOUNT_CARD_CLASS, 'mt-6 max-w-205 overflow-hidden')}>
          {answered.map((topic) => (
            <Link
              key={topic.id}
              href={href(topicHref(topic, categorySlug))}
              className="border-border flex items-center gap-3 border-b px-4.5 py-4 transition-colors hover:bg-white/3"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-base font-medium text-white/95">{topic.title}</span>
                {topic.description ? <span className="text-sm text-white/55">{topic.description}</span> : null}
              </span>
              <ChevronRight className="size-4 shrink-0 text-white/40" aria-hidden />
            </Link>
          ))}
          <Link
            href={href(somethingElseHref)}
            className="flex items-center gap-3 px-4.5 py-4 transition-colors hover:bg-white/3"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-base font-medium text-white/95">Something else</span>
              <span className="text-sm text-white/55">Describe it in a ticket and we&apos;ll help</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-white/40" aria-hidden />
          </Link>
        </div>
      </div>
    </>
  )
}
