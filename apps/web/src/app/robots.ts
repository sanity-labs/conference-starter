import type {MetadataRoute} from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://everything-nyc.sanity.dev'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/studio/'],
      },
      // AI crawlers — uncomment to allow or block AI training crawlers.
      // Allowing these crawlers improves visibility in AI search results (AEO).
      // Blocking them prevents your content from being used for model training.
      // Decide based on your content strategy and licensing preferences.
      //
      // {
      //   userAgent: 'GPTBot',
      //   allow: '/',
      // },
      // {
      //   userAgent: 'ClaudeBot',
      //   allow: '/',
      // },
      // {
      //   userAgent: 'PerplexityBot',
      //   allow: '/',
      // },
      // {
      //   userAgent: 'Google-Extended',
      //   allow: '/',
      // },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
