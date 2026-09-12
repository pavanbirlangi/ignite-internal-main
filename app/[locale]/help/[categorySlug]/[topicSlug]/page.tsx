import HelpTopicDetailWrapper from '@/components/help/HelpTopicDetailWrapper'
import { getWebPageJsonLd } from '@/lib/seo'

interface TopicPageProps {
  params: Promise<{
    locale: string
    categorySlug: string
    topicSlug: string
  }>
}

export default async function TopicPageRoute({ params }: TopicPageProps) {
  const { locale, categorySlug, topicSlug } = await params
  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: `help/${categorySlug}/${topicSlug}`,
    name: 'Help Topic | Increddy',
    description: 'Read detailed support guidance for this topic.',
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd),
        }}
      />
      <HelpTopicDetailWrapper
        categorySlug={categorySlug}
        topicSlug={topicSlug}
      />
    </>
  )
}
