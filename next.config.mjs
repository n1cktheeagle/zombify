/** @type {import('next').NextConfig} */
const nextConfig = {
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
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/feedback/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;