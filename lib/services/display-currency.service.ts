import medusaClient from '../medusa-axios'
import { DEFAULT_CURRENCY, getDisplayCurrency } from '../utils/display-currency'

// Products, carts and orders are priced in USD only. Every other currency is display-only: the
// USD amount times one admin-managed exchange rate (Medusa Admin -> Currencies), served by
// `GET /store/display-currencies`. The charge currency is decided by the payment method at
// checkout (`GET /store/payment-methods`), never by the display currency.
export interface DisplayCurrency {
  code: string
  name: string
  symbol: string
  decimalDigits: number
  // How much 1 USD is in this currency.
  rate: number
}

// `GET /store/display-currencies` response row.
interface RawDisplayCurrency {
  code: string
  name: string | null
  symbol: string | null
  symbol_native: string | null
  decimal_digits: number | null
  rate: number
}

const USD: DisplayCurrency = {
  code: DEFAULT_CURRENCY,
  name: 'US Dollar',
  symbol: '$',
  decimalDigits: 2,
  rate: 1,
}

// The backend caches this list for 5 minutes and the response for 60s, so a matching in-memory
// TTL keeps every product card, cart and checkout render from refetching it.
const CACHE_TTL_MS = 5 * 60 * 1000
let cache: { expiresAt: number; promise: Promise<DisplayCurrency[]> } | null = null

export function getDisplayCurrencies(): Promise<DisplayCurrency[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.promise
  const promise = medusaClient
    .get<{ currencies?: RawDisplayCurrency[] }>('/store/display-currencies')
    .then(({ data }) =>
      (data.currencies ?? []).map(
        (c): DisplayCurrency => ({
          code: String(c.code).toLowerCase(),
          name: c.name ?? String(c.code).toUpperCase(),
          symbol: c.symbol_native || c.symbol || String(c.code).toUpperCase(),
          decimalDigits: typeof c.decimal_digits === 'number' ? c.decimal_digits : 2,
          rate: Number(c.rate),
        }),
      ),
    )
    .catch((error) => {
      cache = null
      throw error
    })
  cache = { expiresAt: Date.now() + CACHE_TTL_MS, promise }
  return promise
}

export interface CurrencyConverter {
  // The currency amounts are shown in after conversion -- the source currency when no rate is
  // known for either side, so an amount is never shown with the wrong symbol.
  currencyCode: string
  convert: (amount: number) => number
}

const identity = (currencyCode: string): CurrencyConverter => ({
  currencyCode,
  convert: (amount) => amount,
})

// Converts amounts from `fromCode` into the visitor's display currency, via USD (rates are
// USD -> currency), rounded to the display currency's decimals.
export async function getDisplayConverter(fromCode = DEFAULT_CURRENCY): Promise<CurrencyConverter> {
  return getCurrencyConverter(fromCode, await getDisplayCurrency())
}

// Same, with the target currency passed in -- for code that can't read cookies itself (anything
// inside an `unstable_cache` callback).
export async function getCurrencyConverter(
  fromCode: string,
  toCodeInput: string,
): Promise<CurrencyConverter> {
  const from = fromCode.toLowerCase()
  const toCode = toCodeInput.toLowerCase()
  if (from === toCode) return identity(from)

  let currencies: DisplayCurrency[]
  try {
    currencies = await getDisplayCurrencies()
  } catch (error) {
    console.error('Failed to load display currencies; showing prices unconverted', error)
    return identity(from)
  }

  const find = (code: string) =>
    code === DEFAULT_CURRENCY ? USD : currencies.find((c) => c.code === code)
  const source = find(from)
  const target = find(toCode)
  if (!source?.rate || !target?.rate) return identity(from)

  const factor = 10 ** target.decimalDigits
  return {
    currencyCode: target.code,
    convert: (amount) => Math.round((amount / source.rate) * target.rate * factor) / factor,
  }
}
