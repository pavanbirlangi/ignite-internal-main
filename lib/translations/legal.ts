import { unstable_cache } from 'next/cache'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import type { LegalPage } from '@/lib/services/legal.service'

/** Convert a slug like "privacy-policy" to "Privacy Policy" */
function slugToLabel(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Translates legal page content (HTML) and sidebar labels.
 * Uses tagHandling: 'html' for page content to preserve HTML structure.
 */
const getTranslatedLegalLabels = unstable_cache(
  async (locale: string, textsToTranslate: string[]) => {
    return translateTextsWithLangbly(textsToTranslate, locale)
  },
  ['legal-page-labels'],
  { revalidate: 3600 },
)

const getTranslatedLegalHtml = unstable_cache(
  async (locale: string, textsToTranslate: string[]) => {
    return translateTextsWithLangbly(textsToTranslate, locale, {
      tagHandling: 'html',
    })
  },
  ['legal-page-html'],
  { revalidate: 3600 },
)

export async function translateLegalData(
  page: LegalPage,
  allSlugs: string[],
  locale: string,
) {
  // Batch 1: Plain text (Sidebar labels)
  const labelsToTranslate = allSlugs.map((slug) => slugToLabel(slug))

  // Batch 2: HTML content
  const htmlToTranslate = [page.page_content || '']

  const [translatedLabels, translatedHtml] = await Promise.all([
    getTranslatedLegalLabels(locale, labelsToTranslate),
    getTranslatedLegalHtml(locale, htmlToTranslate),
  ])

  const sidebarLabelsMap: Record<string, string> = {}
  allSlugs.forEach((slug, i) => {
    sidebarLabelsMap[slug] = translatedLabels[i]
  })

  return {
    translatedPage: {
      ...page,
      page_content: translatedHtml[0],
    },
    sidebarLabelsMap,
  }
}
