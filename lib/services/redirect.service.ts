import medusaClient from '../medusa-axios'

const BACKEND_PRODUCT_PREFIX = '/products/'

// The backend records automatic product redirects as `/products/<handle>` (see its
// product-redirects workflow), but storefront product pages live at `/<handle>`. Manual redirects
// an admin adds may use the storefront's own paths instead, so both forms are looked up and the
// result is translated back to a storefront path.
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
      (await lookup(`${BACKEND_PRODUCT_PREFIX}${slug}`)) ?? (await lookup(`/${slug}`))
    if (!toPath) return null
    const target = toStorefrontPath(toPath)
    return target === `/${slug}` ? null : target
  },
}
