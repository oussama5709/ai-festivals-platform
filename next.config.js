/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for multi-stage Docker builds — copies only necessary files
  // into .next/standalone, making the Docker image ~60% smaller
  output: 'standalone',

  // Allow images from external sources (event websites, Apify, etc.)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.eventbrite.com' },
      { protocol: 'https', hostname: '**.meetup.com' },
      { protocol: 'https', hostname: 'apify.com' },
      { protocol: 'https', hostname: '**.githubusercontent.com' },
    ],
  },

  // Pass API URL to the browser bundle
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '2.0.0',
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  // Redirect /api/* to the backend API (dev convenience)
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },

  // Webpack optimizations
  webpack(config) {
    // Ignore node-specific modules that leak into the browser bundle
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },

  // Strict mode helps catch bugs early
  reactStrictMode: true,

  // Compress responses
  compress: true,

  // Generate ETags for static assets
  generateEtags: true,

  // TypeScript & ESLint — fail the build on errors (not just warnings)
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
