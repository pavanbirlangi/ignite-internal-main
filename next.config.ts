import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  compress: true,
  images: {
    // Next.js image optimization: resized to the displayed size, served as WebP. On Cloudflare
    // every size and format is a billed "unique transformation" (5,000 a month included), so
    // WebP only (every current browser) and a short list of widths keep that count low.
    formats: ['image/webp'],
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [96, 256, 384],
    // Cache optimized images on the server for 24 hours
    minimumCacheTTL: 86400,
    // Show images in the browser when opened on their own ("Open image in new tab") instead of
    // downloading them -- Next's default is "attachment". Safe here: the optimizer never serves
    // SVG (dangerouslyAllowSVG is off, and image-loader.ts serves SVGs directly).
    contentDispositionType: 'inline',
    // Custom loader rewrites /cdn-shopify/ proxy paths → absolute cdn.shopify.com URLs
    // so the optimizer can fetch and serve them as WebP/AVIF without 400 errors
    loaderFile: './lib/image-loader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: 'api.ignkeys.agpro.co.in',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'cms.increddy.com',
      },
      {
        // Medusa backend's S3 file storage (product thumbnails/images) --
        // confirmed live 400 from the image optimizer without this entry.
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      },
      {
        // Product images once the S3 bucket is served through CloudFront (backend R-80).
        protocol: 'https',
        hostname: 'cdn.increddy.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/cdn-shopify/:path*',
        destination: 'https://cdn.shopify.com/:path*',
      },
    ]
  },
  async redirects() {
    return [
      // The bare domain goes to www (Vercel did this as a domain setting; on Cloudflare the worker
      // serves both names).
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'increddy.com' }],
        destination: 'https://www.increddy.com/:path*',
        permanent: true,
      },
      {
        source: '/:locale/product/:slug',
        destination: '/:locale/:slug',
        permanent: true,
      },
      // Note: We cannot easily redirect /:locale/:slug to /:locale/legal/:slug
      // because /:locale/:slug now also matches products.
      // CMS links should be updated to /legal/:slug.
    ]
  },
  // Enable source maps in production (replacing Webpack's custom devtool configuration)
  // to allow Turbopack builds which do not support custom Webpack devtool functions.
  productionBrowserSourceMaps: true,
  experimental: {
    // Styles go in the HTML instead of a separate file the browser must fetch before the first
    // paint (Lighthouse: 150-440 ms of render-blocking CSS).
    inlineCss: true,
  },
}

export default nextConfig
