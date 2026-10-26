// Cloudflare Worker entry: the OpenNext worker, plus two edge caches.
//
// 1. Resized images. OpenNext resizes /_next/image through the Cloudflare Images binding on every
//    request and caches nothing, so each view paid ~0.6 s or more for a fresh resize. The resized
//    image is kept for a week (data centre cache + KV), keyed by the URL and by whether the browser
//    takes WebP (the only format next.config.ts asks for).
// 2. Pages for signed-out visitors. Every page is rendered per request (prices follow the
//    visitor's currency), which took ~1 s of server time before the first byte. A rendered page is
//    kept (in KV, global) per address + region cookies + IP country and served from there: fresh for 60 s,
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
async function pageCacheKey(request, url, env) {
  if (!env.PAGE_CACHE_KV || request.method !== 'GET') return null
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
  const parts = [
    env.CF_VERSION_METADATA?.id || 'dev',
    url.pathname + url.search,
    request.headers.get('cf-ipcountry') || '',
    cookie(cookies, 'user_country'),
    cookie(cookies, 'user_currency'),
  ].join('|')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts))
  return `page:${[...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')}`
}

async function gzip(text) {
  return new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()
}

async function gunzip(buffer) {
  return new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
}

// Stored compressed: a JSON line with the status and headers, then the HTML. proxy.ts's region
// cookies are part of the headers (the same for everyone with this key) and are replayed.
async function storePage(env, key, response) {
  const head = { status: response.status, headers: [...response.headers].filter(([name]) => name !== 'set-cookie'), cookies: response.headers.getSetCookie?.() ?? [] }
  const payload = await gzip(`${JSON.stringify(head)}\n${await response.text()}`)
  await env.PAGE_CACHE_KV.put(key, payload, { expirationTtl: PAGE_KEEP_SECONDS, metadata: { storedAt: Date.now() } })
}

async function servePage(buffer, state) {
  const text = await gunzip(buffer)
  const split = text.indexOf('\n')
  const head = JSON.parse(text.slice(0, split))
  const headers = new Headers(head.headers)
  for (const value of head.cookies) headers.append('set-cookie', value)
  headers.delete('content-length')
  headers.delete('content-encoding')
  headers.set('X-Page-Cache', state)
  return new Response(text.slice(split + 1), { status: head.status, headers })
}

function isCacheablePage(response) {
  return response.status === 200 && (response.headers.get('content-type') || '').includes('text/html')
}

async function handlePage(request, env, ctx, key) {
  const { value, metadata } = await env.PAGE_CACHE_KV.getWithMetadata(key, { type: 'arrayBuffer' })
  if (value) {
    const age = (Date.now() - Number(metadata?.storedAt || 0)) / 1000
    if (age < PAGE_FRESH_SECONDS) return servePage(value, 'HIT')
    // Stale: answer now, render a fresh copy for the next visitor.
    ctx.waitUntil(
      worker.fetch(new Request(request), env, ctx).then((fresh) => (isCacheablePage(fresh) ? storePage(env, key, fresh) : undefined)),
    )
    return servePage(value, 'STALE')
  }

  const response = await worker.fetch(request, env, ctx)
  if (!isCacheablePage(response)) return response
  ctx.waitUntil(storePage(env, key, response.clone()))
  const out = new Response(response.body, response)
  out.headers.set('X-Page-Cache', 'MISS')
  return out
}

// Resized images: the data centre's cache first, then KV (global: a resize made anywhere is
// reused everywhere), and only then a fresh resize.
async function handleImage(request, env, ctx, url) {
  const format = (request.headers.get('accept') || '').includes('image/webp') ? 'webp' : 'original'
  const cacheUrl = new URL(url)
  cacheUrl.searchParams.set('_format', format)
  const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' })
  const kvKey = `img:${format}:${url.search}`.slice(0, 512)

  const cache = caches.default
  const cached = await cache.match(cacheKey)
  if (cached) {
    const hit = new Response(cached.body, cached)
    hit.headers.set('X-Image-Cache', 'HIT')
    return hit
  }

  if (env.PAGE_CACHE_KV) {
    const { value, metadata } = await env.PAGE_CACHE_KV.getWithMetadata(kvKey, { type: 'arrayBuffer' })
    if (value) {
      const fromKv = new Response(value, {
        headers: { 'Content-Type': metadata?.contentType || 'image/webp', 'Cache-Control': `public, max-age=${IMAGE_CACHE_SECONDS}` },
      })
      ctx.waitUntil(cache.put(cacheKey, fromKv.clone()))
      fromKv.headers.set('X-Image-Cache', 'HIT-KV')
      return fromKv
    }
  }

  const response = await worker.fetch(request, env, ctx)
  if (!response.ok) return response

  const body = await response.arrayBuffer()
  const contentType = response.headers.get('content-type') || 'image/webp'
  const cacheable = new Response(body, {
    headers: { 'Content-Type': contentType, 'Cache-Control': `public, max-age=${IMAGE_CACHE_SECONDS}` },
  })
  ctx.waitUntil(cache.put(cacheKey, cacheable.clone()))
  if (env.PAGE_CACHE_KV && body.byteLength < 25 * 1024 * 1024) {
    ctx.waitUntil(env.PAGE_CACHE_KV.put(kvKey, body, { expirationTtl: IMAGE_CACHE_SECONDS, metadata: { contentType } }))
  }
  cacheable.headers.set('X-Image-Cache', 'MISS')
  return cacheable
}

const cachingWorker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/_next/image') return handleImage(request, env, ctx, url)
    const pageKey = await pageCacheKey(request, url, env)
    if (pageKey) return handlePage(request, env, ctx, pageKey)
    return worker.fetch(request, env, ctx)
  },
}

export default cachingWorker
