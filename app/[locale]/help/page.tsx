import type { Metadata } from 'next'
import HelpHub, { type HubIssueType, type HubSearchEntry } from '@/components/help/hub/HelpHub'
import { HelpService, type HelpArticle, type HelpDataResponse, type HelpTopic } from '@/lib/services/help.service'
import { issueTypeHref, topicHref } from '@/lib/help/help-links'
import { plainText } from '@/lib/structured-data'
import { generateSeoMetadata, getWebPageJsonLd } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  let content: HelpDataResponse['data'] | null = null
  try {
    const response = await HelpService.getHelpItems()
    content = response?.data
  } catch (error) {
    console.error('[HelpPage] Failed to fetch data for metadata:', error)
  }

  return generateSeoMetadata(
    content?.seo,
    locale,
    'help',
    'Help Centre | Increddy',
    'Answers about activating keys, delivery and payments, or a ticket to our support team.',
  )
}

// The Help Centre hub, rendered on the server with the issue types and a search index of every
// topic and answer (Directus); recent orders and tickets load in the browser for signed-in visitors.
export default async function HelpPageRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  const [help, topics, articles] = await Promise.all([
    HelpService.getHelpItems().then((r) => r?.data ?? null),
    HelpService.getAllHelpTopics()
      .then((r) => r?.data ?? [])
      .catch((): HelpTopic[] => []),
    HelpService.getAllHelpArticles()
      .then((r) => r?.data ?? [])
      .catch((): HelpArticle[] => []),
  ])

  const issueTypes: HubIssueType[] = (help?.issue_types ?? [])
    .map((item) => item.help_issues_types_id)
    .filter((type) => type?.slug && type.status === 'published')
    .map((type) => ({ slug: type.slug, name: type.name, description: type.description, href: issueTypeHref(type) }))

  const topicBySlug = new Map(topics.map((topic) => [topic.slug, topic]))
  const searchIndex: HubSearchEntry[] = [
    ...topics
      .filter((topic) => topic.issue_type?.slug)
      .map((topic) => ({
        title: topic.title,
        context: topic.issue_type.name,
        text: topic.description ?? '',
        href: topicHref(topic, topic.issue_type.slug!),
      })),
    ...articles.flatMap((article) => {
      const topic = article.help_subtopics?.slug ? topicBySlug.get(article.help_subtopics.slug) : undefined
      if (!topic?.issue_type?.slug) return []
      return [
        {
          title: article.title,
          context: topic.title,
          text: plainText(article.body),
          href: topicHref(topic, topic.issue_type.slug),
        },
      ]
    }),
  ]

  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: 'help',
    name: 'Help Centre | Increddy',
    description: 'Answers about activating keys, delivery and payments, or a ticket to our support team.',
    breadcrumbs: [{ name: 'Help Centre' }],
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <HelpHub
        locale={locale}
        title="Help Centre"
        subtitle="Find an answer in a minute, or send a ticket to our team."
        issueTypes={issueTypes}
        searchIndex={searchIndex}
      />
    </>
  )
}
