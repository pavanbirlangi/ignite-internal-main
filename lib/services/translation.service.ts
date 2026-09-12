import * as deepl from 'deepl-node'

// ─── Language Code Mapping ───────────────────────────────────────────────────
// Maps app language codes (from region-data.ts) to DeepL target language codes.
// Some codes differ: EN needs a variant, PT needs PT-PT/PT-BR, ZH needs ZH-HANS.
const DEEPL_LANG_MAP: Record<string, string> = {
  EN: 'EN-US',
  PT: 'PT-PT',
  ZH: 'ZH-HANS',
  // All other codes (DE, FR, ES, IT, etc.) are the same in both systems
}

// Languages not supported by DeepL — requests for these return original text
const UNSUPPORTED_LANGUAGES = new Set([
  'TL', // Filipino
  'BN', // Bengali
  'HE', // Hebrew
  'NO', // Norwegian
  'AR', // Arabic
  'KO', // Korean
])

// ─── In-Memory Cache ─────────────────────────────────────────────────────────
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const translationCache = new Map<
  string,
  { text: string; expiry: number }
>()

function getCacheKey(
  text: string,
  targetLang: string,
  options?: deepl.TranslateTextOptions,
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
  translationCache.set(key, { text, expiry: Date.now() + CACHE_TTL_MS })
}

// ─── DeepL Client ────────────────────────────────────────────────────────────
let deeplClient: deepl.DeepLClient | null = null

function getDeepLClient(): deepl.DeepLClient {
  if (!deeplClient) {
    const authKey = process.env.DEEPL_AUTH_KEY
    if (!authKey) {
      throw new Error(
        'DEEPL_AUTH_KEY environment variable is not set. Please add it to your .env file.',
      )
    }
    deeplClient = new deepl.DeepLClient(authKey)
  }
  return deeplClient
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the DeepL-compatible target language code for a given app language code.
 * Returns null if the language is unsupported by DeepL.
 */
export function getDeepLTargetLang(
  appLangCode: string,
): string | null {
  const code = appLangCode.toUpperCase()
  if (UNSUPPORTED_LANGUAGES.has(code)) return null
  return DEEPL_LANG_MAP[code] || code
}

/**
 * Translates an array of texts to the target language using DeepL.
 * Returns the translated texts in the same order.
 *
 * - Skips translation for English (returns original texts)
 * - Returns original texts for unsupported languages
 * - Uses in-memory cache to avoid redundant API calls
 * - Batches uncached texts into a single DeepL API call
 */
export async function translateTexts(
  texts: string[],
  targetLangCode: string,
  options: deepl.TranslateTextOptions = {},
): Promise<string[]> {
  const appCode = targetLangCode.toUpperCase()

  // Skip translation for English
  if (appCode === 'EN') return texts

  // Check if language is supported
  const deeplLang = getDeepLTargetLang(appCode)
  if (!deeplLang) {
    console.log(
      `[Translation] Language "${appCode}" is not supported by DeepL. Returning original texts.`,
    )
    return texts
  }

  // Separate cached and uncached texts
  const results: string[] = new Array(texts.length)
  const uncachedIndices: number[] = []
  const uncachedTexts: string[] = []

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i]
    // Skip empty strings
    if (!text || text.trim() === '') {
      results[i] = text
      continue
    }

    const cacheKey = getCacheKey(text, deeplLang, options)
    const cached = getCached(cacheKey)
    if (cached !== null) {
      results[i] = cached
    } else {
      uncachedIndices.push(i)
      uncachedTexts.push(text)
    }
  }

  // If everything was cached, return early
  if (uncachedTexts.length === 0) {
    console.log(
      `[Translation] All ${texts.length} texts served from cache for "${deeplLang}".`,
    )
    return results
  }

  console.log(
    `[Translation] Translating ${uncachedTexts.length} texts to "${deeplLang}" (${texts.length - uncachedTexts.length} from cache). Options: ${JSON.stringify(options)}`,
  )

  try {
    const client = getDeepLClient()
    const translated = await client.translateText(
      uncachedTexts,
      null, // auto-detect source language
      deeplLang as deepl.TargetLanguageCode,
      options,
    )

    // Map results back and populate cache
    const translatedArray = Array.isArray(translated)
      ? translated
      : [translated]
    for (let i = 0; i < uncachedIndices.length; i++) {
      const originalIndex = uncachedIndices[i]
      const translatedText = translatedArray[i]?.text ?? texts[originalIndex]
      results[originalIndex] = translatedText

      // Cache the result
      const cacheKey = getCacheKey(texts[originalIndex], deeplLang, options)
      setCache(cacheKey, translatedText)
    }

    return results
  } catch (error) {
    console.error('[Translation] DeepL translation failed:', error)
    // Gracefully fall back to original texts
    for (const idx of uncachedIndices) {
      results[idx] = texts[idx]
    }
    return results
  }
}
