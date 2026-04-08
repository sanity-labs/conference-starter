/**
 * URL builder for announcement distribution.
 * Maps document types to website path prefixes.
 */

const SITE_URL = process.env.SITE_URL || 'https://everything-nyc.sanity.dev'

const typePrefixMap: Record<string, string> = {
  session: '/sessions',
  person: '/speakers',
  venue: '/venue',
  announcement: '/announcements',
}

export function buildUrl(type: string, slug: string): string {
  const prefix = typePrefixMap[type] || ''
  return `${SITE_URL}${prefix}/${slug}`
}

export function buildAnnouncementUrl(slug: string): string {
  return buildUrl('announcement', slug)
}
