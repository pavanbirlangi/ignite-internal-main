import { unstable_cache } from 'next/cache'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import type { ActivationGuidesResponse, GuideDetail } from '@/lib/services/help.service'

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
 * Translates the activation guides list page data.
 */
export async function translateActivationGuidesData(
  data: ActivationGuidesResponse['data'],
  locale: string,
): Promise<ActivationGuidesResponse['data']> {
  const textsToTranslate: string[] = [data.page_title || '']

  const guides = data.guides || []
  for (const item of guides) {
    textsToTranslate.push(item.guides_id.title || '')
  }

  const translated = await getTranslatedActivationGuidePlainTexts(
    locale,
    textsToTranslate,
  )

  let idx = 0
  const page_title = translated[idx++]

  const translatedGuides = guides.map((item) => ({
    ...item,
    guides_id: {
      ...item.guides_id,
      title: translated[idx++],
    },
  }))

  return {
    ...data,
    page_title,
    guides: translatedGuides,
  }
}

/**
 * Translates a single activation guide detail.
 * Uses tagHandling: 'html' for rich content to preserve HTML structure.
 */
export async function translateGuideDetailData(
  guide: GuideDetail,
  locale: string,
): Promise<GuideDetail> {
  // Batch 1: Plain text fields
  const plainTexts: string[] = [
    guide.title || '',
    guide.description || '',
    guide.author_name || '',
  ]

  const tags = guide.tags || []
  for (const tag of tags) {
    plainTexts.push(tag)
  }

  const relatedGuides = guide.related_guides || []
  for (const item of relatedGuides) {
    plainTexts.push(item.related_guides_id.title || '')
  }

  // Batch 2: HTML content
  const htmlTexts: string[] = [guide.content || '']

  const [translatedPlain, translatedHtml] = await Promise.all([
    getTranslatedActivationGuidePlainTexts(locale, plainTexts),
    getTranslatedActivationGuideHtmlTexts(locale, htmlTexts),
  ])

  let idx = 0
  const title = translatedPlain[idx++]
  const description = translatedPlain[idx++]
  const author_name = translatedPlain[idx++]

  const translatedTags = tags.map(() => translatedPlain[idx++])

  const translatedRelatedGuides = relatedGuides.map((item) => ({
    ...item,
    related_guides_id: {
      ...item.related_guides_id,
      title: translatedPlain[idx++],
    },
  }))

  const content = translatedHtml[0]

  return {
    ...guide,
    title,
    description,
    content,
    author_name,
    tags: translatedTags,
    related_guides: translatedRelatedGuides,
  }
}
