/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable experimental features
  experimental: {
    // App directory is stable in Next.js 13.4+
    serverComponentsExternalPackages: ['@stellar/stellar-sdk'],
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Public runtime configuration
  publicRuntimeConfig: {
    NODE_ENV: process.env.NODE_ENV,
  },

  // Webpack configuration for Stellar SDK
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle node modules that need special treatment
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };

    // Handle .mjs files
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },

  // Image optimization
  images: {
    domains: ['avatars.githubusercontent.com', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/docs',
        destination: 'https://docs.questxlm.org',
        permanent: true,
      },
    ];
  },

  // Rewrites for API routes
  async rewrites() {
    return [
      {
        source: '/api/oracle/:path*',
        destination: `${process.env.NEXT_PUBLIC_ORACLE_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },

  // Output configuration for Docker
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Compression
  compress: true,

  // Power optimization
  poweredByHeader: false,

  // Generate ETags
  generateEtags: true,

  // Page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],

  // Trailing slash
  trailingSlash: false,

  // ESLint configuration
  eslint: {
    dirs: ['pages', 'components', 'lib', 'src'],
  },

  // TypeScript configuration
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

module.exports = nextConfig;