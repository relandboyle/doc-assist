import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev, isServer }) => {
    // Configure webpack cache to prevent "invalid stored block lengths" error
    if (dev) {
      config.cache = {
        type: 'filesystem',
        cacheDirectory: path.resolve(process.cwd(), '.next/cache'),
        compression: 'gzip',
        maxAge: 172800000, // 2 days
      }
    }
    return config
  },
}

export default nextConfig
