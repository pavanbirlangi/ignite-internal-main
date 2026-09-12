/**
 * Custom Next.js image loader.
 *
 * Next.js `loaderFile` functions receive { src, width, quality } and must
 * return the final URL the browser will fetch for that image. The built-in
 * optimizer is still invoked server-side; this function only controls the
 * client-side src URL generation.
 *
 * For /cdn-shopify/ proxy paths: rewrite to the absolute cdn.shopify.com URL
 * so Next.js can locate and optimize the image (it's in remotePatterns).
 * For all other paths: pass through to the default /_next/image endpoint.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  // If it is an SVG, serve it directly without optimizing since it is a vector format
  if (src.includes('.svg')) {
    if (src.startsWith('/cdn-shopify/')) {
      return src.replace('/cdn-shopify/', 'https://cdn.shopify.com/')
    }
    return src
  }

  // Rewrite /cdn-shopify/ proxy path → absolute cdn.shopify.com URL
  // cdn.shopify.com is in remotePatterns so the optimizer can fetch it
  const resolvedSrc = src.startsWith('/cdn-shopify/')
    ? src.replace('/cdn-shopify/', 'https://cdn.shopify.com/')
    : src

  // Next.js image optimizer in this build only allows the default quality of 75.
  // Any other quality value (including 99 or 100) returns a 400 Bad Request error.
  // We force 75 here to ensure all optimized images load successfully.
  const resolvedQuality = 75

  return `/_next/image?url=${encodeURIComponent(resolvedSrc)}&w=${width}&q=${resolvedQuality}`
}
