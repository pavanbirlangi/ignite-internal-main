import medusaClient from '../medusa-axios'
import { getDisplayCurrencies } from './display-currency.service'

export interface SelectableCurrency {
  code: string
  name: string
  symbol: string
}

export interface SelectableCountry {
  code: string
  name: string
}

let countriesPromise: Promise<SelectableCountry[]> | null = null

/**
 * Currencies offered in the header picker: the ones enabled on the admin's Currencies page
 * (`GET /store/display-currencies`), never a list kept in the storefront.
 */
export async function getSelectableCurrencies(): Promise<SelectableCurrency[]> {
  const currencies = await getDisplayCurrencies()
  return currencies
    .map((c) => ({ code: c.code.toUpperCase(), name: c.name, symbol: c.symbol }))
    .sort((a, b) => a.name.localeCompare(b.name))
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
