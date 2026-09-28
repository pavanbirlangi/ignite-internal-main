import type { Metadata } from 'next'
import { generateSeoMetadata, getWebPageJsonLd } from '@/lib/seo'
import { FaqService } from '@/lib/services/faq.service'
import { translateFaqItems } from '@/lib/translations/faq'
import FaqSection from '@/components/faq/FaqSection'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  return generateSeoMetadata(
    null,
    locale,
    'faq',
    'Frequently Asked Questions | Increddy',
    'Answers to common questions about buying, receiving, and using your Increddy keys.',
  )
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: 'faq',
    name: 'Frequently Asked Questions | Increddy',
    description:
      'Answers to common questions about buying, receiving, and using your Increddy keys.',
  })

  let groups: Awaited<ReturnType<typeof FaqService.getAllGrouped>> = []
  try {
    groups = await FaqService.getAllGrouped()
    if (locale.toUpperCase() !== 'EN') {
      groups = await Promise.all(
        groups.map(async (group) => ({
          category: group.category,
          items: await translateFaqItems(group.items, locale),
        })),
      )
    }
  } catch (error) {
    console.error('[FaqPage] Failed to fetch FAQ data:', error)
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd),
        }}
      />
      <main className="bg-background min-h-screen w-full">
        <div className="max-w-container mx-auto w-full px-4 py-10 md:py-16">
          <h1 className="mb-10 text-2xl font-semibold md:text-3xl">
            Frequently Asked Questions
          </h1>

          {groups.length === 0 ? (
            <p className="text-muted-foreground">
              No FAQs are available right now. Please check back soon.
            </p>
          ) : (
            <div className="flex flex-col gap-12">
              {groups.map((group) => (
                <FaqSection
                  key={group.category.id}
                  title={group.category.name}
                  items={group.items}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
