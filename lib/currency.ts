const FALLBACK_NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const currencyFormatterCache = new Map<string, Intl.NumberFormat | null>()

/**
 * Gets or creates an Intl.NumberFormat for the given currency code.
 * We avoid hardcoding fraction digits to let Intl.NumberFormat use the
 * currency's default (e.g., 0 for CLP, JPY; 2 for USD, EUR).
 */
function getCurrencyFormatter(currencyCode: string): Intl.NumberFormat | null {
  const normalizedCode = currencyCode.trim().toUpperCase()

  if (currencyFormatterCache.has(normalizedCode)) {
    return currencyFormatterCache.get(normalizedCode) ?? null
  }

  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizedCode,
      currencyDisplay: 'symbol',
    })

    currencyFormatterCache.set(normalizedCode, formatter)
    return formatter
  } catch {
    currencyFormatterCache.set(normalizedCode, null)
    return null
  }
}

export const formatCurrency = (
  amount: number,
  currencyCode?: string,
): string => {
  if (!currencyCode) {
    return FALLBACK_NUMBER_FORMATTER.format(amount)
  }

  const formatter = getCurrencyFormatter(currencyCode)

  if (!formatter) {
    return `${currencyCode.toUpperCase()} ${FALLBACK_NUMBER_FORMATTER.format(amount)}`
  }

  const parts = formatter.formatToParts(amount)
  let currencyPart = ''
  let numberPart = ''
  const isNegative = amount < 0

  for (const part of parts) {
    if (part.type === 'currency') {
      currencyPart = part.value
    } else if (part.type !== 'literal' || part.value.trim() !== '') {
      if (part.type !== 'minusSign') {
        numberPart += part.value
      }
    }
  }

  return `${isNegative ? '-' : ''}${currencyPart} ${numberPart}`
}

export const getCurrencyDisplay = (currencyCode?: string): string => {
  const normalizedCode = currencyCode?.trim().toUpperCase()

  if (!normalizedCode) {
    return '$'
  }

  const formatter = getCurrencyFormatter(normalizedCode)

  if (!formatter) {
    return normalizedCode
  }

  const symbol = formatter
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value

  return symbol || normalizedCode
}

export const formatPrice = (
  amount: string | number,
  currencyCode?: string,
): string => {
  const numeric =
    typeof amount === 'string' ? Number.parseFloat(amount) : amount
  if (!Number.isFinite(numeric)) return ''
  return formatCurrency(numeric, currencyCode)
}

/**
 * Formats a Medusa v2 money amount for display.
 *
 * Unlike Medusa v1, Medusa v2 stores/returns amounts as decimal numbers in
 * major currency units (e.g. `10` for $10.00), not integer minor units
 * (cents) — confirmed against the backend's own seed data (`amount: 10` for
 * a $10 product). This is the same convention `formatPrice` already expects,
 * so this is a thin named alias — call this at Medusa call sites (e.g.
 * `calculated_price.calculated_amount` + `currency_code`) purely so it's
 * obvious at a glance that no minor-to-major conversion is needed there,
 * without coupling those call sites to the Shopify-oriented name.
 */
export const formatMedusaAmount = (
  amount: number,
  currencyCode?: string,
): string => formatPrice(amount, currencyCode)
