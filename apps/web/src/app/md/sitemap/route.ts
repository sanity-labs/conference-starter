import {mdClient, markdownResponse, markdownHeader, markdownFooter} from '../_lib/response'
import {
  CONFERENCE_QUERY,
  SESSIONS_SUMMARY_QUERY,
  SPEAKERS_QUERY,
  ANNOUNCEMENTS_QUERY,
  PAGE_SLUGS_QUERY,
} from '@repo/sanity-queries'

export async function GET() {
  const [conference, sessions, speakers, announcements, pages] = await Promise.all([
    mdClient.fetch(CONFERENCE_QUERY),
    mdClient.fetch(SESSIONS_SUMMARY_QUERY),
    mdClient.fetch(SPEAKERS_QUERY),
    mdClient.fetch(ANNOUNCEMENTS_QUERY),
    mdClient.fetch(PAGE_SLUGS_QUERY),
  ])

  const lines: string[] = []
  lines.push(markdownHeader(`${conference?.name ?? 'Conference'} — Sitemap`, {
    path: '/sitemap.md',
    description: 'Complete index of all conference content available as markdown',
  }))

  if (conference?.tagline) lines.push(`> ${conference.tagline}`)

  // Sessions
  if (sessions && sessions.length > 0) {
    lines.push(`## Sessions (${sessions.length})`)
    const sessionLines = sessions.map((s) => {
      const type = s.sessionType
        ? `[${s.sessionType.charAt(0).toUpperCase() + s.sessionType.slice(1)}]`
        : ''
      return `- [${s.title}](/sessions/${s.slug}.md) ${type}`
    })
    lines.push(sessionLines.join('\n'))
  }

  // Speakers
  if (speakers && speakers.length > 0) {
    lines.push(`## Speakers (${speakers.length})`)
    const speakerLines = speakers.map((s) => {
      const info = [s.role, s.company].filter(Boolean).join(', ')
      return `- [${s.name}](/speakers/${s.slug}.md)${info ? ` — ${info}` : ''}`
    })
    lines.push(speakerLines.join('\n'))
  }

  // Announcements
  if (announcements && announcements.length > 0) {
    lines.push(`## Announcements (${announcements.length})`)
    const announcementLines = announcements.map((a) => {
      const date = a.publishedAt
        ? new Date(a.publishedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        : null
      return `- [${a.title}](/announcements/${a.slug}.md)${date ? ` — ${date}` : ''}`
    })
    lines.push(announcementLines.join('\n'))
  }

  // Pages
  lines.push('## Pages')
  const pageLinks = [
    `- [Schedule](/schedule.md)`,
    `- [FAQ](/faq.md)`,
    `- [Venue](/venue.md)`,
    `- [Sponsors](/sponsors.md)`,
  ]
  if (pages && pages.length > 0) {
    for (const page of pages) {
      pageLinks.push(`- [/${page.slug}](/${page.slug}.md)`)
    }
  }
  lines.push(pageLinks.join('\n'))

  lines.push(markdownFooter())

  return markdownResponse(lines.join('\n\n'))
}
