import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn, localizedHref } from '@/lib/utils'
import { ACCOUNT_CARD_CLASS, ACCOUNT_PRIMARY_BUTTON_CLASS } from '@/components/library/account-ui'
import type { GuideDetail, GuideSummary } from '@/lib/services/help.service'
import type { ActivationGuidesLabels } from '@/lib/translations/activation-guides'
import { guideImageUrl, OTHER_GROUP } from './guide-groups'
import GuidesBreadcrumb from './GuidesBreadcrumb'
import styles from './GuideContent.module.css'

interface ActivationGuideDetailProps {
  locale: string
  labels: ActivationGuidesLabels
  guide: GuideDetail
  // The other guides to suggest, already in order.
  otherGuides: GuideSummary[]
  // The guide's category as the list names it (translated); null when it has none.
  categoryName: string | null
}

function formatDate(value: string, locale: string): string | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  try {
    return date.toLocaleDateString(locale.toLowerCase() === 'en' ? 'en-GB' : locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }
}

// One guide: breadcrumb, title, "By ... · Updated ..." only when set, optional header image, the
// steps from Directus, a ticket box, and other guides beside it (below it on phones).
export default function ActivationGuideDetail({
  locale,
  labels,
  guide,
  otherGuides,
  categoryName,
}: ActivationGuideDetailProps) {
  const image = guideImageUrl(guide.image)
  const updated = guide.date_updated || guide.published_date
  const updatedText = updated ? formatDate(updated, locale) : null
  const meta = [
    guide.author_name?.trim() ? labels.by.replace('{name}', guide.author_name.trim()) : null,
    updatedText ? labels.updated.replace('{date}', updatedText) : null,
  ]
    .filter(Boolean)
    .join(' · ')
  const categorySlug = guide.category?.slug || OTHER_GROUP

  return (
    <div className="container pt-6 pb-16 md:pt-8 md:pb-24">
      <GuidesBreadcrumb
        locale={locale}
        items={[
          { name: labels.helpCentre, path: '/help' },
          { name: labels.pageTitle, path: '/activation-guides' },
          ...(categoryName ? [{ name: categoryName, path: `/activation-guides?category=${categorySlug}` }] : []),
        ]}
      />

      <div className="mt-3.5 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0 max-w-190">
          <h1 className="text-2xl leading-tight font-bold text-white/95 md:text-3xl">{guide.title}</h1>
          {meta ? <p className="mt-2.5 text-sm text-white/50">{meta}</p> : null}
          {guide.description?.trim() ? (
            <p className="mt-4 text-base text-white/65">{guide.description}</p>
          ) : null}

          {image ? (
            <div className="bg-secondary mt-6 overflow-hidden rounded-xl">
              <img src={image} alt={guide.title} className="max-h-90 w-full object-cover" />
            </div>
          ) : null}

          <div className={cn(styles.content, 'mt-6')} dangerouslySetInnerHTML={{ __html: guide.content || '' }} />

          <div className={cn(ACCOUNT_CARD_CLASS, 'mt-10 flex flex-wrap items-center justify-between gap-4 px-5 py-4')}>
            <div>
              <p className="text-base font-bold text-white/95">{labels.articleHelpTitle}</p>
              <p className="text-sm text-white/65">{labels.articleHelpText}</p>
            </div>
            <Link href={localizedHref(locale, '/help/create-ticket')} className={ACCOUNT_PRIMARY_BUTTON_CLASS}>
              {labels.createTicket}
            </Link>
          </div>
        </article>

        <aside className={cn(ACCOUNT_CARD_CLASS, 'p-5')}>
          <p className="mb-1.5 text-base font-bold text-white/95">{labels.otherGuides}</p>
          {otherGuides.length > 0 ? (
            <ul>
              {otherGuides.map((other) => (
                <li key={other.slug} className="border-border border-b">
                  <Link
                    href={localizedHref(locale, `/activation-guides/${other.slug}`)}
                    className="block py-2.5 text-sm text-white/80 transition-colors hover:text-white"
                  >
                    {other.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <Link
            href={localizedHref(locale, '/activation-guides')}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#5B93F0] hover:underline"
          >
            {labels.allGuides}
            <ChevronRight className="size-3.5" />
          </Link>
        </aside>
      </div>
    </div>
  )
}
