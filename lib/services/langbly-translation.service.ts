type LangblyTranslationOptions = {
  tagHandling?: 'html'
}

type LangblyTranslationResponse = {
  data?: {
    translations?: Array<{
      translatedText?: string
    }>
  }
}

const CACHE_TTL_MS = 60 * 60 * 1000
const translationCache = new Map<string, { text: string; expiry: number }>()

function getCacheKey(
  text: string,
  targetLang: string,
  options?: LangblyTranslationOptions,
): string {
  const optionsKey = options ? JSON.stringify(options) : ''
  return `${targetLang}::${optionsKey}::${text}`
}

function getCached(key: string): string | null {
  const entry = translationCache.get(key)
  if (!entry) return null

  if (Date.now() > entry.expiry) {
    translationCache.delete(key)
    return null
  }

  return entry.text
}

function setCache(key: string, text: string): void {
  translationCache.set(key, {
    text,
    expiry: Date.now() + CACHE_TTL_MS,
  })
}

function getLangblyApiKey(): string {
  const apiKey = process.env.LANGBLY_API_KEY

  if (!apiKey) {
    throw new Error(
      'LANGBLY_API_KEY environment variable is not set. Please add it to your .env file.',
    )
  }

  return apiKey
}

function getLangblyTargetLang(appLangCode: string): string {
  return appLangCode.toLowerCase()
}

export async function translateTextsWithLangbly(
  texts: string[],
  targetLangCode: string,
  options: LangblyTranslationOptions = {},
): Promise<string[]> {
  const appCode = targetLangCode.toUpperCase()

  if (appCode === 'EN') return texts

  const target = getLangblyTargetLang(appCode)
  const results: string[] = new Array(texts.length)
  const uncachedIndices: number[] = []
  const uncachedTexts: string[] = []

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i]

    if (!text || text.trim() === '') {
      results[i] = text
      continue
    }

    const cacheKey = getCacheKey(text, target, options)
    const cached = getCached(cacheKey)

    if (cached !== null) {
      results[i] = cached
      continue
    }

    uncachedIndices.push(i)
    uncachedTexts.push(text)
  }

  if (uncachedTexts.length === 0) {
    return results
  }

  try {
    const response = await fetch(
      'https://api.langbly.com/language/translate/v2',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': getLangblyApiKey(),
        },
        body: JSON.stringify({
          q: uncachedTexts,
          source: 'en',
          target,
          format: options.tagHandling === 'html' ? 'html' : 'text',
          quality: 'standard',
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Langbly request failed with status ${response.status}`)
    }

    const data = (await response.json()) as LangblyTranslationResponse
    const translatedTexts =
      data.data?.translations?.map(
        (translation) => translation.translatedText ?? '',
      ) ?? []

    for (let i = 0; i < uncachedIndices.length; i++) {
      const originalIndex = uncachedIndices[i]
      const translatedText = translatedTexts[i] ?? texts[originalIndex]

      results[originalIndex] = translatedText

      const cacheKey = getCacheKey(texts[originalIndex], target, options)
      setCache(cacheKey, translatedText)
    }

    return results
  } catch (error) {
    console.error('[LangblyTranslation] Translation failed:', error)

    for (const idx of uncachedIndices) {
      results[idx] = texts[idx]
    }

    return results
  }
}
