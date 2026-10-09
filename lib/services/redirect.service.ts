import medusaClient from '../medusa-axios'

const BACKEND_PRODUCT_PREFIX = '/products/'

// Redirects are stored with the storefront's own `/<handle>` paths. A manual redirect an admin
// typed as `/products/<handle>` is still honored, so that form is checked second and translated
// back to a storefront path.
function toStorefrontPath(path: string): string {
  return path.startsWith(BACKEND_PRODUCT_PREFIX)
    ? `/${path.slice(BACKEND_PRODUCT_PREFIX.length)}`
    : path
}

async function lookup(path: string): Promise<string | null> {
  try {
    const { data } = await medusaClient.get('/store/redirects', { params: { path } })
    return typeof data?.to_path === 'string' && data.to_path ? data.to_path : null
  } catch {
    // A 404 here is the normal "no redirect for this path" answer.
    return null
  }
}

export const RedirectService = {
  /** Where an old product slug now lives, as a storefront path, or null if it has no redirect. */
  findProductRedirect: async (slug: string): Promise<string | null> => {
    const toPath =
      (await lookup(`/${slug}`)) ?? (await lookup(`${BACKEND_PRODUCT_PREFIX}${slug}`))
    if (!toPath) return null
    const target = toStorefrontPath(toPath)
    return target === `/${slug}` ? null : target
  },
}
