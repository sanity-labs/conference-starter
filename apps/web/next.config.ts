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
  // Prevent Turbopack from bundling email packages — avoids duplicate React
  // instances in API routes that render React Email components
  serverExternalPackages: [
    '@repo/email',
    '@react-email/render',
    '@react-email/components',
  ],
}

export default nextConfig
