import type {MetadataRoute} from 'next'
import {client} from '@/sanity/client'
import {SPEAKER_SLUGS_QUERY, SESSION_SLUGS_QUERY} from '@repo/sanity-queries'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://everything-nyc.sanity.dev'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [speakers, sessions] = await Promise.all([
    client.fetch(SPEAKER_SLUGS_QUERY),
    client.fetch(SESSION_SLUGS_QUERY),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    {url: SITE_URL, changeFrequency: 'weekly', priority: 1},
    {url: `${SITE_URL}/speakers`, changeFrequency: 'weekly', priority: 0.8},
    {url: `${SITE_URL}/schedule`, changeFrequency: 'weekly', priority: 0.8},
    {url: `${SITE_URL}/sponsors`, changeFrequency: 'monthly', priority: 0.6},
    {url: `${SITE_URL}/venue`, changeFrequency: 'monthly', priority: 0.6},
    {url: `${SITE_URL}/cfp`, changeFrequency: 'weekly', priority: 0.7},
  ]

  const speakerPages: MetadataRoute.Sitemap = speakers.map((s) => ({
    url: `${SITE_URL}/speakers/${s.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const sessionPages: MetadataRoute.Sitemap = sessions.map((s) => ({
    url: `${SITE_URL}/sessions/${s.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...speakerPages, ...sessionPages]
}
