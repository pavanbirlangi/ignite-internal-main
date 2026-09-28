import { unstable_cache } from 'next/cache'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import type { FaqItem } from '@/lib/services/faq.service'

const getTranslatedFaqTexts = unstable_cache(
  async (locale: string, textsToTranslate: string[]) => {
    return translateTextsWithLangbly(textsToTranslate, locale)
  },
  ['faq-texts'],
  { revalidate: 3600 },
)

/** Translates every question/answer in a flat FAQ list, batched into one Langbly call. */
export async function translateFaqItems(
  items: FaqItem[],
  locale: string,
): Promise<FaqItem[]> {
  if (items.length === 0) return items

  const textsToTranslate = items.flatMap((item) => [item.question, item.answer])
  const translated = await getTranslatedFaqTexts(locale, textsToTranslate)

  return items.map((item, index) => ({
    ...item,
    question: translated[index * 2] ?? item.question,
    answer: translated[index * 2 + 1] ?? item.answer,
  }))
}
