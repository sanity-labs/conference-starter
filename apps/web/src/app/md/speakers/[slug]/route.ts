import {mdClient, markdownResponse, markdownHeader, markdownFooter} from '../../_lib/response'
import {SPEAKER_DETAIL_QUERY} from '@repo/sanity-queries'
import {ptToMarkdown} from '@/lib/portable-text-markdown'

export async function GET(_req: Request, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const speaker = await mdClient.fetch(SPEAKER_DETAIL_QUERY, {slug})
  if (!speaker) return new Response('Not found', {status: 404})

  const info = [speaker.role, speaker.company].filter(Boolean).join(', ')

  const lines: string[] = []
  lines.push(markdownHeader(speaker.name ?? 'Speaker', {
    path: `/speakers/${slug}`,
    description: info || undefined,
  }))

  if (info) lines.push(info)

  // Bio
  if (speaker.bio) {
    lines.push('## Bio')
    lines.push(ptToMarkdown(speaker.bio as unknown[]))
  }

  // Social links
  const links = [
    speaker.twitter && `[Twitter](${speaker.twitter})`,
    speaker.github && `[GitHub](${speaker.github})`,
    speaker.linkedin && `[LinkedIn](${speaker.linkedin})`,
    speaker.website && `[Website](${speaker.website})`,
  ].filter(Boolean)
  if (links.length > 0) {
    lines.push('## Links')
    lines.push(links.join(' · '))
  }

  // Sessions
  if (speaker.sessions && speaker.sessions.length > 0) {
    lines.push('## Sessions')
    for (const session of speaker.sessions) {
      const type = session.sessionType
        ? session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)
        : null
      let line = `- [${session.title}](/sessions/${session.slug}.md)`
      if (type) line += ` [${type}]`
      if (session.track) line += ` — ${session.track.name}`
      lines.push(line)
    }
  }

  lines.push(markdownFooter({path: `/speakers/${slug}`, parent: {label: 'All speakers', href: '/speakers.md'}}))

  return markdownResponse(lines.join('\n\n'))
}
