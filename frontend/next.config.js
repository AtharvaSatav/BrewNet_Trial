/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: true,
  },
  // Disable static optimization
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configure dynamic pages
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  compiler: {
    styledComponents: true,
  },
  webpack: (config) => {
    config.experiments = { ...config.experiments, topLevelAwait: true }
    return config
  },
  // Add dynamic routes configuration
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ]
  }
}

module.exports = nextConfig 