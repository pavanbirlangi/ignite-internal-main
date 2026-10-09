import medusaClient from '../medusa-axios'

export interface MedusaRegion {
  id: string
  name: string
  currencyCode: string
  countries: string[]
}

// Module-level cache -- regions essentially never change without a backend
// redeploy/admin edit, same lifetime assumption cart.service.ts's own
// (now-replaced) copy of this logic already made.
let cachedRegions: MedusaRegion[] | null = null

/**
 * The one real source of truth for "what regions/currencies does this store
 * actually support" -- reads Medusa's live `/store/regions` directly, no
 * hardcoded region or currency list. Whatever the admin configures in Medusa
 * Admin shows up here automatically.
 */
export async function getRegions(): Promise<MedusaRegion[]> {
  if (cachedRegions) return cachedRegions

  const { data } = await medusaClient.get('/store/regions')
  const raw: Array<{
    id: string
    name: string
    currency_code: string
    countries?: Array<{ iso_2: string }>
  }> = data.regions ?? []

  if (!raw.length) {
    throw new Error('No regions are configured on the backend')
  }

  cachedRegions = raw.map((region) => ({
    id: region.id,
    name: region.name,
    currencyCode: (region.currency_code || '').toUpperCase(),
    countries: (region.countries ?? []).map((c) => c.iso_2.toLowerCase()),
  }))

  return cachedRegions
}

/**
 * Matches a country code (lowercase iso_2, e.g. from a geo-IP lookup or the
 * `user_country` cookie) against a real region's country list, falling back
 * to the first region returned if there's no match -- same fallback
 * cart.service.ts's own copy of this logic already used.
 */
export async function resolveRegionForCountry(
  countryCode?: string | null,
): Promise<MedusaRegion> {
  const regions = await getRegions()
  const country = countryCode?.toLowerCase()

  const matched = country
    ? regions.find((region) => region.countries.includes(country))
    : undefined

  return matched ?? regions[0]
}
