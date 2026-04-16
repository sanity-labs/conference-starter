import type {NextConfig} from 'next'
import {sanity} from 'next-sanity/live/cache-life'

// Baseline CSP. Shipped in Report-Only so forkers can observe violations
// before enforcing. Promote to `Content-Security-Policy` once the preview
// deploy is quiet for 24h.
//
// Covered origins:
// - self + Sanity CDN for images
// - Google Fonts (Inter via next/font — stylesheet + woff2)
// - Anthropic API (direct provider, see apps/web/src/app/api/chat/route.ts)
// - Sanity Agent Context MCP endpoint (SANITY_CONTEXT_MCP_URL)
// - Sanity Studio embed / Visual Editing
const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-ancestors 'self' https://*.sanity.studio https://*.sanity.dev",
  "img-src 'self' data: https://cdn.sanity.io",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self' https://api.anthropic.com https://*.api.sanity.io https://*.apicdn.sanity.io",
].join('; ')

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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {key: 'Content-Security-Policy-Report-Only', value: cspDirectives},
          {key: 'X-Content-Type-Options', value: 'nosniff'},
          {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
        ],
      },
    ]
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
