import { unstable_cache } from 'next/cache'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import type { ContactUsResponse } from '@/lib/services/help.service'

/**
 * Translates all text fields in the contact page data using Langbly.
 * Emails and URLs are intentionally left untranslated.
 */
const getTranslatedContactTexts = unstable_cache(
  async (locale: string, textsToTranslate: string[]) => {
    return translateTextsWithLangbly(textsToTranslate, locale)
  },
  ['contact-page-texts'],
  { revalidate: 3600 },
)

export async function translateContactData(
  data: ContactUsResponse['data'],
  locale: string,
): Promise<ContactUsResponse['data']> {
  const textsToTranslate: string[] = [
    data.heading || '',
    data.description || '',
    data.bottom_text_title || '',
    data.bottom_text_desc || '',
    data.cta_text || '',
  ]

  const contactTypes = data.contact_types || []
  for (const ct of contactTypes) {
    textsToTranslate.push(ct.title || '', ct.text || '')
  }

  const translated = await getTranslatedContactTexts(locale, textsToTranslate)

  let idx = 0
  return {
    ...data,
    heading: translated[idx++],
    description: translated[idx++],
    bottom_text_title: translated[idx++],
    bottom_text_desc: translated[idx++],
    cta_text: translated[idx++],
    contact_types: contactTypes.map((ct) => ({
      ...ct,
      title: translated[idx++],
      text: translated[idx++],
    })),
  }
}
