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
  async rewrites() {
    return {
      beforeFiles: [
        // Content negotiation: Accept: text/markdown → serve markdown
        {
          source: '/:path*',
          has: [{type: 'header', key: 'accept', value: '(.*text/markdown.*)'}],
          destination: '/md/:path*',
        },
      ],
      afterFiles: [
        // .md suffix URLs → internal /md/ route handlers
        {source: '/sitemap.md', destination: '/md/sitemap'},
        {source: '/:section.md', destination: '/md/:section'},
        {source: '/:section/:slug.md', destination: '/md/:section/:slug'},
      ],
    }
  },
}

export default nextConfig
