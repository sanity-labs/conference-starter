import {mdClient, markdownResponse, markdownHeader, markdownFooter} from '../../_lib/response'
import {ANNOUNCEMENT_DETAIL_QUERY} from '@repo/sanity-queries'

export async function GET(_req: Request, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const announcement = await mdClient.fetch(ANNOUNCEMENT_DETAIL_QUERY, {slug})
  if (!announcement) return new Response('Not found', {status: 404})

  const lines: string[] = []
  lines.push(markdownHeader(announcement.title ?? 'Announcement', {path: `/announcements/${slug}`}))

  if (announcement.publishedAt) {
    lines.push(
      `*${new Date(announcement.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })}*`,
    )
  }

  if (announcement.body) {
    lines.push(announcement.body)
  }

  // Links
  if (announcement.links && announcement.links.length > 0) {
    lines.push('## Links')
    for (const link of announcement.links) {
      if (link._type === 'externalLink' && link.url) {
        lines.push(`- [${link.label || link.url}](${link.url})`)
      } else if (link._type === 'internalLink' && link.reference) {
        const ref = link.reference
        const href = ref._type === 'session' ? `/sessions/${ref.slug}.md` : `/speakers/${ref.slug}.md`
        lines.push(`- [${link.label || ref.name}](${href})`)
      }
    }
  }

  lines.push(markdownFooter({path: `/announcements/${slug}`, parent: {label: 'All announcements', href: '/announcements.md'}}))

  return markdownResponse(lines.join('\n\n'))
}
