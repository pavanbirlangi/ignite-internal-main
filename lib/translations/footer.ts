import { unstable_cache } from 'next/cache'
import { translateTextsWithLangbly } from '@/lib/services/langbly-translation.service'
import { type FooterData } from '@/lib/services/footer.service'

/**
 * All translatable static UI strings for the footer.
 */
export interface FooterTranslations {
  locationTitle: string
  getInTheGame: string
  checkoutReview: string
}

/** Default English strings */
const defaultStrings: FooterTranslations = {
  locationTitle: 'Location',
  getInTheGame: 'Get in the game:',
  checkoutReview: 'Checkout Our Review:',
}

export function getDefaultFooterTranslations(): FooterTranslations {
  return { ...defaultStrings }
}

// Locale-scoped cache for plain-text strings
const getTranslatedPlainTexts = (locale: string, texts: string[]) =>
  unstable_cache(
    async () => translateTextsWithLangbly(texts, locale),
    [`footer-plain-${locale}`],
    { revalidate: 3600 },
  )()

// Locale-scoped cache for HTML strings (location field)
const getTranslatedHtmlTexts = (locale: string, texts: string[]) =>
  unstable_cache(
    async () => translateTextsWithLangbly(texts, locale, { tagHandling: 'html' }),
    [`footer-html-${locale}`],
    { revalidate: 3600 },
  )()


export async function translateFooterData(
  data: FooterData,
  locale: string,
): Promise<{ footerData: FooterData; translations: FooterTranslations }> {
  const [translatedLocation] = await getTranslatedHtmlTexts(locale, [
    data.location || '',
  ])

  const staticKeys = Object.keys(defaultStrings) as (keyof FooterTranslations)[]
  const staticTexts = staticKeys.map((key) => defaultStrings[key])

  const plainTexts: string[] = [
    ...staticTexts,
    data.bottom_text || '',
    data.review_text || '',
  ]

  const links = data.links || []
  for (const section of links) {
    plainTexts.push(section.label || '')
    for (const link of section.links) {
      plainTexts.push(link.name || '')
    }
  }

  const translated = await getTranslatedPlainTexts(locale, plainTexts)

  // ── 3. Reconstruct static translations ───────────────────────────────────
  let idx = 0
  const translationsResult = { ...defaultStrings }
  staticKeys.forEach((key) => {
    translationsResult[key] = translated[idx++]
  })

  // ── 4. Reconstruct CMS data ───────────────────────────────────────────────
  const bottom_text = translated[idx++]
  const review_text = translated[idx++]

  const translatedLinks = links.map((section) => {
    const label = translated[idx++]
    const translatedSubLinks = section.links.map((link) => {
      const name = translated[idx++]
      return { ...link, name }
    })
    return { ...section, label, links: translatedSubLinks }
  })

  return {
    footerData: {
      ...data,
      location: translatedLocation || data.location,
      bottom_text: bottom_text || data.bottom_text,
      review_text: review_text || data.review_text,
      links: translatedLinks,
    },
    translations: translationsResult,
  }
}
