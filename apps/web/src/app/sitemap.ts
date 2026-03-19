import type {MetadataRoute} from 'next'
import {client} from '@/sanity/client'
import {
  SPEAKER_SLUGS_QUERY,
  SESSION_SLUGS_QUERY,
  PAGE_SLUGS_QUERY,
  ANNOUNCEMENT_SLUGS_QUERY,
} from '@repo/sanity-queries'
import {SITE_URL} from '@/lib/metadata'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [speakers, sessions, pages, announcements] = await Promise.all([
    client.fetch(SPEAKER_SLUGS_QUERY),
    client.fetch(SESSION_SLUGS_QUERY),
    client.fetch(PAGE_SLUGS_QUERY),
    client.fetch(ANNOUNCEMENT_SLUGS_QUERY),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    {url: SITE_URL, changeFrequency: 'weekly', priority: 1},
    {url: `${SITE_URL}/sessions`, changeFrequency: 'weekly', priority: 0.8},
    {url: `${SITE_URL}/speakers`, changeFrequency: 'weekly', priority: 0.8},
    {url: `${SITE_URL}/schedule`, changeFrequency: 'weekly', priority: 0.8},
    {url: `${SITE_URL}/sponsors`, changeFrequency: 'monthly', priority: 0.6},
    {url: `${SITE_URL}/venue`, changeFrequency: 'monthly', priority: 0.6},
    {url: `${SITE_URL}/faq`, changeFrequency: 'monthly', priority: 0.6},
    {url: `${SITE_URL}/cfp`, changeFrequency: 'weekly', priority: 0.7},
    {url: `${SITE_URL}/announcements`, changeFrequency: 'weekly', priority: 0.7},
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

  const dynamicPages: MetadataRoute.Sitemap = pages.map((p) => ({
    url: `${SITE_URL}/${p.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const announcementPages: MetadataRoute.Sitemap = announcements.map((a) => ({
    url: `${SITE_URL}/announcements/${a.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  return [...staticPages, ...speakerPages, ...sessionPages, ...dynamicPages, ...announcementPages]
}
