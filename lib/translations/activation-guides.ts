import { unstable_cache } from 'next/cache'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import type {
  ActivationGuidesPageContent,
  GuideDetail,
  GuideSummary,
} from '@/lib/services/help.service'

/**
 * The activation guides pages' own texts. The editor can override the list page's subtitle and
 * the help box in Directus (singleton `activation_guide`); everything else is fixed here.
 */
export interface ActivationGuidesLabels {
  helpCentre: string
  pageTitle: string
  subtitle: string
  searchPlaceholder: string
  searchPlaceholderShort: string
  all: string
  other: string
  noResults: string
  clearSearch: string
  helpBoxTitle: string
  helpBoxText: string
  createTicket: string
  moreHelp: string
  by: string
  updated: string
  articleHelpTitle: string
  articleHelpText: string
  otherGuides: string
  allGuides: string
}

const defaultLabels: ActivationGuidesLabels = {
  helpCentre: 'Help Centre',
  pageTitle: 'Activation guides',
  subtitle: 'Step-by-step help to redeem your key or code on each platform.',
  searchPlaceholder: 'Search guides, e.g. "Steam" or "gift card"',
  searchPlaceholderShort: 'Search guides',
  all: 'All',
  other: 'Other',
  noResults: 'No guides match "{query}".',
  clearSearch: 'Clear search',
  helpBoxTitle: 'Key still not working?',
  helpBoxText: "Tell us within 72 hours and we'll sort it out.",
  createTicket: 'Create a ticket',
  moreHelp: 'More help',
  by: 'By {name}',
  updated: 'Updated {date}',
  articleHelpTitle: "Didn't work?",
  articleHelpText: "Tell us within 72 hours: we'll check the key.",
  otherGuides: 'Other guides',
  allGuides: 'All activation guides',
}

export function getDefaultActivationGuidesLabels(): ActivationGuidesLabels {
  return { ...defaultLabels }
}

// The list page's labels with the editor's texts from Directus in place of the defaults.
export function activationGuidesLabels(page?: ActivationGuidesPageContent | null): ActivationGuidesLabels {
  return {
    ...defaultLabels,
    ...(page?.page_title?.trim() && { pageTitle: page.page_title.trim() }),
    ...(page?.subtitle?.trim() && { subtitle: page.subtitle.trim() }),
    ...(page?.help_box_title?.trim() && { helpBoxTitle: page.help_box_title.trim() }),
    ...(page?.help_box_text?.trim() && { helpBoxText: page.help_box_text.trim() }),
  }
}

const getTranslatedActivationGuidePlainTexts = unstable_cache(
  async (locale: string, textsToTranslate: string[]) => {
    return translateTextsWithLangbly(textsToTranslate, locale)
  },
  ['activation-guides-plain-texts'],
  { revalidate: 3600 },
)

const getTranslatedActivationGuideHtmlTexts = unstable_cache(
  async (locale: string, textsToTranslate: string[]) => {
    return translateTextsWithLangbly(textsToTranslate, locale, {
      tagHandling: 'html',
    })
  },
  ['activation-guides-html-texts'],
  { revalidate: 3600 },
)

/**
 * Translates the labels and every guide's title, description and category name, in one batch.
 * Empty strings stay empty (nothing to translate).
 */
export async function translateActivationGuidesList(
  labels: ActivationGuidesLabels,
  guides: GuideSummary[],
  locale: string,
): Promise<{ labels: ActivationGuidesLabels; guides: GuideSummary[] }> {
  const labelKeys = Object.keys(labels) as (keyof ActivationGuidesLabels)[]
  const texts: string[] = labelKeys.map((key) => labels[key])
  for (const guide of guides) {
    texts.push(guide.title || '', guide.description || '', guide.category?.name || '')
  }

  const translated = await getTranslatedActivationGuidePlainTexts(locale, texts)

  let idx = 0
  const translatedLabels = { ...labels }
  for (const key of labelKeys) translatedLabels[key] = translated[idx++] || labels[key]

  const translatedGuides = guides.map((guide) => {
    const title = translated[idx++] || guide.title
    const description = translated[idx++] || guide.description
    const categoryName = translated[idx++]
    return {
      ...guide,
      title,
      description,
      category: guide.category ? { ...guide.category, name: categoryName || guide.category.name } : null,
    }
  })

  return { labels: translatedLabels, guides: translatedGuides }
}

/**
 * Translates a single activation guide detail.
 * Uses tagHandling: 'html' for rich content to preserve HTML structure.
 */
export async function translateGuideDetailData(
  guide: GuideDetail,
  locale: string,
): Promise<GuideDetail> {
  const plainTexts: string[] = [guide.title || '', guide.description || '']
  const htmlTexts: string[] = [guide.content || '']

  const [translatedPlain, translatedHtml] = await Promise.all([
    getTranslatedActivationGuidePlainTexts(locale, plainTexts),
    getTranslatedActivationGuideHtmlTexts(locale, htmlTexts),
  ])

  return {
    ...guide,
    title: translatedPlain[0] || guide.title,
    description: translatedPlain[1] || guide.description,
    content: translatedHtml[0] || guide.content,
  }
}
