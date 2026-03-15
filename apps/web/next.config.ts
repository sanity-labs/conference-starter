import type {NextConfig} from 'next'
import {sanity} from 'next-sanity/live/cache-life'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    sanity,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  // Prevent Turbopack from bundling these — avoids duplicate React instances
  // when @portabletext/react and @react-email/render are used together in API routes
  serverExternalPackages: [
    '@react-email/render',
    '@react-email/components',
    '@portabletext/react',
  ],
}

export default nextConfig
