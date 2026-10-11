// Single-variant products carry a placeholder variant name -- Medusa's "Default variant" (and
// Shopify's "Default Title" from before the migration) -- which shouldn't be shown to customers.
const PLACEHOLDER_VARIANT_TITLES = new Set(['default variant', 'default title'])

export function getVariantDisplayName(title: string | null | undefined): string | undefined {
  if (!title || PLACEHOLDER_VARIANT_TITLES.has(title.trim().toLowerCase())) return undefined
  return title
}
