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
  // Prevent Turbopack from bundling @react-email — avoids duplicate React
  // instances in API routes that use @react-email/render
  serverExternalPackages: [
    '@react-email/render',
    '@react-email/components',
  ],
}

export default nextConfig
