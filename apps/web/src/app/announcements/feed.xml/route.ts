import {client} from '@/sanity/client'
import {ANNOUNCEMENTS_QUERY} from '@repo/sanity-queries'
import {SITE_URL, SITE_NAME} from '@/lib/metadata'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const announcements = await client.fetch(ANNOUNCEMENTS_QUERY)

  const items = (announcements ?? [])
    .map((a) => {
      if (!a.title) return ''
      const link = `${SITE_URL}/announcements/${a.slug}`
      const pubDate = a.publishedAt
        ? new Date(a.publishedAt).toUTCString()
        : new Date().toUTCString()
      const description = a.body ? escapeXml(a.body.slice(0, 300)) : ''
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      ${description ? `<description>${description}</description>` : ''}
    </item>`
    })
    .filter(Boolean)
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)} — Announcements</title>
    <link>${SITE_URL}/announcements</link>
    <description>Latest announcements from ${escapeXml(SITE_NAME)}</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/announcements/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
