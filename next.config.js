/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable aggressive route prefetching in production
  experimental: {
    optimisticClientCache: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    // Image optimization settings
    formats: ['image/webp', 'image/avif'], // Use modern formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Responsive breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Smaller image sizes
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache for 30 days
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Add headers to prevent caching of redirects
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
