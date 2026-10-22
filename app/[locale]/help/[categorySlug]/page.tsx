import HelpTopicsListWrapper from '@/components/help/HelpTopicsListWrapper'
import { getWebPageJsonLd, slugLabel } from '@/lib/seo'

interface CategoryPageProps {
  params: Promise<{
    locale: string
    categorySlug: string
  }>
}

export default async function CategoryPageRoute({ params }: CategoryPageProps) {
  const { locale, categorySlug } = await params
  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: `help/${categorySlug}`,
    name: 'Help Category | Increddy',
    description: 'Browse support topics in this help category.',
    breadcrumbs: [{ name: 'Help center', path: '/help' }, { name: slugLabel(categorySlug) }],
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd),
        }}
      />
      <HelpTopicsListWrapper categorySlug={categorySlug} />
    </>
  )
}
