import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import GuidesBreadcrumb from '@/components/help/activation-guides/GuidesBreadcrumb'
import HelpAnswers from '@/components/help/hub/HelpAnswers'
import { ACCOUNT_CARD_CLASS } from '@/components/library/account-ui'
import { HelpService } from '@/lib/services/help.service'
import { ticketHref, topicHref } from '@/lib/help/help-links'
import { cn, localizedHref } from '@/lib/utils'
import { getWebPageJsonLd } from '@/lib/seo'

interface TopicPageProps {
  params: Promise<{ locale: string; categorySlug: string; topicSlug: string }>
}

async function getTopic(categorySlug: string, topicSlug: string) {
  const topics = await HelpService.getAllHelpTopics().then((r) => r?.data ?? [])
  const topic = topics.find((t) => t.slug === topicSlug && t.issue_type?.slug === categorySlug)
  const siblings = topics.filter((t) => t.issue_type?.slug === categorySlug && t.slug !== topicSlug && !t.redirect)
  return { topic, siblings }
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { categorySlug, topicSlug } = await params
  const { topic } = await getTopic(categorySlug, topicSlug).catch(() => ({ topic: undefined }))
  return {
    title: topic ? `${topic.title} | Help Centre | Increddy` : 'Help Centre | Increddy',
    description: topic?.description || 'Read detailed support guidance for this topic.',
  }
}

// A topic's answers, then "Did this solve it?" with a ticket that already knows the topic; other
// topics of the same issue type beside it (below on phones). An unknown topic is a real 404.
export default async function TopicPageRoute({ params }: TopicPageProps) {
  const { locale, categorySlug, topicSlug } = await params
  const [{ topic, siblings }, articlesResponse] = await Promise.all([
    getTopic(categorySlug, topicSlug),
    HelpService.getHelpArticles(topicSlug),
  ])
  if (!topic) notFound()

  const articles = (articlesResponse?.data ?? []).filter((article) => article.status === 'published')
  const typeName = topic.issue_type.name
  const ticketPath = ticketHref({
    topic: topic.slug,
    global: Boolean(topic.create_ticket_global || topic.issue_type.create_ticket_global),
  })

  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: `help/${categorySlug}/${topicSlug}`,
    name: `${topic.title} | Help Centre | Increddy`,
    description: topic.description || 'Read detailed support guidance for this topic.',
    breadcrumbs: [
      { name: 'Help Centre', path: '/help' },
      { name: typeName, path: `/help/${categorySlug}` },
      { name: topic.title },
    ],
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <div className="container pt-6 pb-16 md:pt-8 md:pb-20">
        <GuidesBreadcrumb
          locale={locale}
          items={[
            { name: 'Help Centre', path: '/help' },
            { name: typeName, path: `/help/${categorySlug}` },
            { name: topic.title },
          ]}
        />
        <div className="mt-3.5 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
          <div className="min-w-0 max-w-205">
            <h1 data-display className="text-2xl leading-tight font-bold text-white/95 md:text-3xl">{topic.title}</h1>
            {topic.description ? <p className="mt-2 mb-6 text-base text-white/65">{topic.description}</p> : <div className="mb-6" />}
            <HelpAnswers locale={locale} articles={articles} ticketPath={ticketPath} />
          </div>

          <aside className={cn(ACCOUNT_CARD_CLASS, 'p-5')}>
            <p className="mb-1.5 text-base font-bold text-white/95">More about {typeName.toLowerCase()}</p>
            {siblings.length > 0 ? (
              <ul>
                {siblings.map((sibling) => (
                  <li key={sibling.id} className="border-border border-b">
                    <Link
                      href={localizedHref(locale, topicHref(sibling, categorySlug))}
                      className="block py-2.5 text-sm text-white/80 transition-colors hover:text-white"
                    >
                      {sibling.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <Link
              href={localizedHref(locale, '/activation-guides')}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#5B93F0] hover:underline"
            >
              Activation guides
              <ChevronRight className="size-3.5" />
            </Link>
          </aside>
        </div>
      </div>
    </>
  )
}
