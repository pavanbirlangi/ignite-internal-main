import { unstable_cache } from 'next/cache'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import { type AboutUsData } from '@/lib/services/about.service'

/**
 * Translates all text fields in the AboutUsData object using Langbly.
 * Batches all strings into a single translation call for efficiency.
 */
const getTranslatedAboutTexts = unstable_cache(
  async (locale: string, textsToTranslate: string[]) => {
    return translateTextsWithLangbly(textsToTranslate, locale)
  },
  ['about-page-texts'],
  { revalidate: 3600 },
)

export async function translateAboutData(
  data: AboutUsData,
  locale: string,
): Promise<AboutUsData> {
  const textsToTranslate: string[] = [
    data.title || '',
    data.description || '',
    data.btn_text || '',
    data.section1_title || '',
    data.section2_title || '',
    data.section2_description || '',
  ]

  const s1Blocks = data.section1_blocks || []
  for (const block of s1Blocks) {
    textsToTranslate.push(block.title || '', block.subtitle || '', block.description || '')
  }

  const s2Blocks = data.section2_blocks || []
  for (const block of s2Blocks) {
    textsToTranslate.push(block.title || '', block.description || '')
  }

  const translated = await getTranslatedAboutTexts(locale, textsToTranslate)

  let idx = 0
  return {
    ...data,
    title: translated[idx++],
    description: translated[idx++],
    btn_text: translated[idx++],
    section1_title: translated[idx++],
    section2_title: translated[idx++],
    section2_description: translated[idx++],
    section1_blocks: s1Blocks.map((block) => ({
      ...block,
      title: translated[idx++],
      subtitle: translated[idx++],
      description: translated[idx++],
    })),
    section2_blocks: s2Blocks.map((block) => ({
      ...block,
      title: translated[idx++],
      description: translated[idx++],
    })),
  }
}
