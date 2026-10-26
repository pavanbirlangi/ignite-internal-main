// Cloudflare Worker entry: the OpenNext worker, plus two edge caches.
//
// 1. Resized images. OpenNext resizes /_next/image through the Cloudflare Images binding on every
//    request and caches nothing, so each view paid ~0.6 s for a fresh resize. The resized image is
//    kept for a week, keyed by the URL and by whether the browser takes WebP (the only format
//    next.config.ts asks for).
// 2. Pages for signed-out visitors. Every page is rendered per request (prices follow the
//    visitor's currency), which took ~1 s of server time before the first byte. A rendered page is
//    kept per address + region cookies + IP country and served from the cache: fresh for 60 s,
//    after that still served at once while a new copy renders in the background
//    (stale-while-revalidate), so content is at most one visit behind. Checkout prices come from
//    the live cart, never from a cached page.
// Built by `opennextjs-cloudflare build`.
import worker from './.open-next/worker.js'

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js'

const IMAGE_CACHE_SECONDS = 7 * 24 * 60 * 60

const PAGE_FRESH_SECONDS = 60
// How long a stale page may still be served while a new one renders.
const PAGE_KEEP_SECONDS = 24 * 60 * 60
// Never cached: personal or transactional pages (checked without the /de-style language prefix).
const UNCACHED_PREFIXES = ['/api', '/_next', '/cart', '/checkout', '/dashboard', '/order', '/account', '/auth', '/help/create-ticket']
const LOCALE_PREFIX = /^\/[a-z]{2}(?=\/|$)/

function cookie(header, name) {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

// The request's page-cache key, or null when the request must go straight to the app.
function pageCacheKey(request, url, env) {
  if (request.method !== 'GET') return null
  if (!(request.headers.get('accept') || '').includes('text/html')) return null
  // Next's in-app navigations and prefetches fetch RSC data, not HTML.
  if (request.headers.get('rsc') || request.headers.get('next-router-prefetch') || url.searchParams.has('_rsc')) return null
  const path = url.pathname.replace(LOCALE_PREFIX, '') || '/'
  if (UNCACHED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return null
  if (path.includes('.')) return null

  const cookies = request.headers.get('cookie') || ''
  // Signed in: server-side calls carry the customer's token, so the page is theirs alone.
  if (cookie(cookies, 'access_token')) return null

  // What the server render and proxy.ts's cookies depend on (see proxy.ts): the address (language,
  // ?currency=), the region cookies, and the IP country (first visits; the ip_country cookie).
  const key = new URL(url)
  key.searchParams.set('_page', [
    env.CF_VERSION_METADATA?.id || 'dev',
    request.headers.get('cf-ipcountry') || '',
    cookie(cookies, 'user_country'),
    cookie(cookies, 'user_currency'),
  ].join('|'))
  return new Request(key.toString(), { method: 'GET' })
}

// The Cache API won't store a response that sets cookies, so proxy.ts's region cookies travel in
// a header and are put back on the way out (they are the same for everyone with this key).
async function storePage(cache, key, response) {
  const headers = new Headers(response.headers)
  const setCookies = response.headers.getSetCookie?.() ?? []
  headers.delete('set-cookie')
  headers.set('x-stored-set-cookie', JSON.stringify(setCookies))
  headers.set('x-stored-cache-control', response.headers.get('cache-control') || '')
  headers.set('x-stored-at', String(Date.now()))
  headers.set('cache-control', `public, max-age=${PAGE_KEEP_SECONDS}`)
  await cache.put(key, new Response(response.body, { status: response.status, headers }))
}

function servePage(stored, state) {
  const headers = new Headers(stored.headers)
  for (const value of JSON.parse(headers.get('x-stored-set-cookie') || '[]')) headers.append('set-cookie', value)
  // The browser gets the app's own cache policy (no browser caching of pages).
  headers.set('cache-control', headers.get('x-stored-cache-control') || 'private, no-cache, no-store, max-age=0, must-revalidate')
  headers.delete('x-stored-set-cookie')
  headers.delete('x-stored-cache-control')
  headers.delete('x-stored-at')
  headers.set('X-Page-Cache', state)
  return new Response(stored.body, { status: stored.status, headers })
}

function isCacheablePage(response) {
  return response.status === 200 && (response.headers.get('content-type') || '').includes('text/html')
}

async function handlePage(request, env, ctx, key) {
  const cache = caches.default
  const stored = await cache.match(key)
  if (stored) {
    const age = (Date.now() - Number(stored.headers.get('x-stored-at') || 0)) / 1000
    if (age < PAGE_FRESH_SECONDS) return servePage(stored, 'HIT')
    // Stale: answer now, render a fresh copy for the next visitor.
    ctx.waitUntil(
      worker.fetch(new Request(request), env, ctx).then((fresh) => (isCacheablePage(fresh) ? storePage(cache, key, fresh) : undefined)),
    )
    return servePage(stored, 'STALE')
  }

  const response = await worker.fetch(request, env, ctx)
  if (!isCacheablePage(response)) return response
  const [forVisitor, forCache] = response.body.tee()
  ctx.waitUntil(storePage(cache, key, new Response(forCache, response)))
  const out = new Response(forVisitor, response)
  out.headers.set('X-Page-Cache', 'MISS')
  return out
}

async function handleImage(request, env, ctx, url) {
  const format = (request.headers.get('accept') || '').includes('image/webp') ? 'webp' : 'original'
  const cacheUrl = new URL(url)
  cacheUrl.searchParams.set('_format', format)
  const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' })

  const cache = caches.default
  const cached = await cache.match(cacheKey)
  if (cached) {
    const hit = new Response(cached.body, cached)
    hit.headers.set('X-Image-Cache', 'HIT')
    return hit
  }

  const response = await worker.fetch(request, env, ctx)
  if (!response.ok) return response

  const cacheable = new Response(response.body, response)
  cacheable.headers.set('Cache-Control', `public, max-age=${IMAGE_CACHE_SECONDS}`)
  ctx.waitUntil(cache.put(cacheKey, cacheable.clone()))
  cacheable.headers.set('X-Image-Cache', 'MISS')
  return cacheable
}

const cachingWorker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/_next/image') return handleImage(request, env, ctx, url)
    const pageKey = pageCacheKey(request, url, env)
    if (pageKey) return handlePage(request, env, ctx, pageKey)
    return worker.fetch(request, env, ctx)
  },
}

export default cachingWorker
