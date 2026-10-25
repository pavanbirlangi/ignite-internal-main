// Cloudflare Worker entry: the OpenNext worker, plus an edge cache for resized images.
//
// OpenNext resizes /_next/image through the Cloudflare Images binding on every request; the
// response isn't cached anywhere, so each view of an image paid ~0.6 s for a fresh resize. Here
// the resized image is kept in the data centre's cache for a week, keyed by the URL and by
// whether the browser takes WebP (the only format next.config.ts asks for).
// Built by `opennextjs-cloudflare build`.
import worker from './.open-next/worker.js'

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js'

const IMAGE_CACHE_SECONDS = 7 * 24 * 60 * 60

const imageCachingWorker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (request.method !== 'GET' || url.pathname !== '/_next/image') {
      return worker.fetch(request, env, ctx)
    }

    const format = (request.headers.get('accept') || '').includes('image/webp') ? 'webp' : 'original'
    const cacheUrl = new URL(url)
    cacheUrl.searchParams.set('_format', format)
    const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' })

    const cache = caches.default
    const cached = await cache.match(cacheKey)
    if (cached) return cached

    const response = await worker.fetch(request, env, ctx)
    if (!response.ok) return response

    const cacheable = new Response(response.body, response)
    cacheable.headers.set('Cache-Control', `public, max-age=${IMAGE_CACHE_SECONDS}`)
    ctx.waitUntil(cache.put(cacheKey, cacheable.clone()))
    return cacheable
  },
}

export default imageCachingWorker
