import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  compress: true,
  images: {
    // Next.js image optimization enabled — serves WebP/AVIF and resizes to display dimensions
    formats: ['image/avif', 'image/webp'],
    // Cache optimized images on the server for 24 hours
    minimumCacheTTL: 86400,
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
}

export default nextConfig
