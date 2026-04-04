import {mdClient, markdownResponse, markdownHeader, markdownFooter} from '../_lib/response'
import {ANNOUNCEMENTS_QUERY} from '@repo/sanity-queries'

export async function GET() {
  const announcements = await mdClient.fetch(ANNOUNCEMENTS_QUERY)
  if (!announcements || announcements.length === 0) {
    return markdownResponse('# Announcements\n\nNo announcements yet.')
  }

  const lines: string[] = []
  lines.push(markdownHeader(`Announcements (${announcements.length})`, {path: '/announcements'}))

  for (const a of announcements) {
    const date = a.publishedAt
      ? new Date(a.publishedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null
    let line = `- [${a.title}](/announcements/${a.slug}.md)`
    if (date) line += ` — ${date}`
    lines.push(line)
  }

  lines.push(markdownFooter({path: '/announcements'}))

  return markdownResponse(lines.join('\n'))
}
