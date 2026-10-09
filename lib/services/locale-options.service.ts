import medusaClient from '../medusa-axios'

export interface SelectableCurrency {
  code: string
  name: string
  symbol: string
}

export interface SelectableCountry {
  code: string
  name: string
}

let currenciesPromise: Promise<SelectableCurrency[]> | null = null
let countriesPromise: Promise<SelectableCountry[]> | null = null

/**
 * Currencies offered in the header picker. Admin-managed, not a list kept in the storefront.
 * Medusa's core `/store/currencies` returns every currency the backend knows rather than only the
 * store's enabled ones, so it's a stand-in until a supported-currencies endpoint exists
 * (MEDUSA_MIGRATION_BACKEND_REQUIREMENTS.md, R-44) -- swap the URL here when it does.
 */
export function getSelectableCurrencies(): Promise<SelectableCurrency[]> {
  if (!currenciesPromise) {
    currenciesPromise = medusaClient
      .get('/store/currencies', { params: { limit: 500 } })
      .then(({ data }) =>
        (data.currencies ?? [])
          .map((c: any) => ({
            code: String(c.code).toUpperCase(),
            name: c.name ?? String(c.code).toUpperCase(),
            symbol: c.symbol_native || c.symbol || String(c.code).toUpperCase(),
          }))
          .sort((a: SelectableCurrency, b: SelectableCurrency) => a.name.localeCompare(b.name)),
      )
      .catch((error) => {
        currenciesPromise = null
        throw error
      })
  }
  return currenciesPromise
}

/** Countries offered in the header picker: every country the admin has added to a region. */
export function getSelectableCountries(): Promise<SelectableCountry[]> {
  if (!countriesPromise) {
    countriesPromise = medusaClient
      .get('/store/regions', { params: { fields: 'countries.iso_2,countries.display_name' } })
      .then(({ data }) => {
        const byCode = new Map<string, SelectableCountry>()
        for (const region of data.regions ?? []) {
          for (const c of region.countries ?? []) {
            const code = String(c.iso_2).toUpperCase()
            byCode.set(code, { code, name: c.display_name || code })
          }
        }
        return [...byCode.values()].sort((a, b) => a.name.localeCompare(b.name))
      })
      .catch((error) => {
        countriesPromise = null
        throw error
      })
  }
  return countriesPromise
}
