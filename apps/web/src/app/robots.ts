import type {MetadataRoute} from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://everything-nyc.sanity.dev'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/studio/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
