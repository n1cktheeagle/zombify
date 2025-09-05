/** @type {import('next').NextConfig} */
const landingOnly = process.env.NEXT_PUBLIC_LAUNCH_MODE === 'landing-only'

const nextConfig = {
  // ESLint control (always skipping during builds in current setup; keep behavior)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // When launching only the landing page, allow TypeScript errors to pass the build
  typescript: landingOnly
    ? {
        ignoreBuildErrors: true,
      }
    : undefined,

  // Configure images for Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ufvgthregqhlvczykode.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Force dynamic rendering - prevents caching issues
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },

  // Add headers to prevent caching
  async headers() {
    return [
      {
        source: '/dashboard',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        source: '/feedback/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;