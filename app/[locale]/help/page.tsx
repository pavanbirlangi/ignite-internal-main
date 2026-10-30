import type { Metadata } from 'next'
import HelpHub, { type HubIssueType } from '@/components/help/hub/HelpHub'
import { HelpService, type HelpDataResponse } from '@/lib/services/help.service'
import { issueTypeHref } from '@/lib/help/help-links'
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

// The Help Centre hub, rendered on the server with the issue types (Directus); recent orders and
// tickets load in the browser for signed-in visitors.
export default async function HelpPageRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  const help = await HelpService.getHelpItems().then((r) => r?.data ?? null)

  const issueTypes: HubIssueType[] = (help?.issue_types ?? [])
    .map((item) => item.help_issues_types_id)
    .filter((type) => type?.slug && type.status === 'published')
    .map((type) => ({ slug: type.slug, name: type.name, description: type.description, href: issueTypeHref(type) }))

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
      />
    </>
  )
}
