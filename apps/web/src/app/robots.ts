import type {MetadataRoute} from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://contentops-conf.sanity.dev'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/studio/'],
      },
      // AI crawlers — allowed for AEO (Answer Engine Optimization)
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/', '/studio/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/api/', '/studio/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/', '/studio/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/', '/studio/'],
      },
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
        disallow: ['/api/', '/studio/'],
      },
      {
        userAgent: 'cohere-ai',
        allow: '/',
        disallow: ['/api/', '/studio/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
