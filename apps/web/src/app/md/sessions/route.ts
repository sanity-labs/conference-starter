import {mdClient, markdownResponse, markdownHeader, markdownFooter} from '../_lib/response'
import {SESSIONS_LISTING_QUERY} from '@repo/sanity-queries'

export async function GET() {
  const sessions = await mdClient.fetch(SESSIONS_LISTING_QUERY)
  if (!sessions || sessions.length === 0) {
    return markdownResponse('# Sessions\n\nNo sessions available yet.')
  }

  const lines: string[] = []
  lines.push(markdownHeader(`Sessions (${sessions.length})`, {path: '/sessions'}))

  for (const session of sessions) {
    const type = session.sessionType
      ? session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)
      : null
    const speakers =
      session.speakers && session.speakers.length > 0
        ? session.speakers.map((s) => s.name).join(', ')
        : null
    const meta = [type, session.level, session.duration && `${session.duration} min`]
      .filter(Boolean)
      .join(' · ')

    let line = `- [${session.title}](/sessions/${session.slug}.md)`
    if (meta) line += ` — ${meta}`
    if (speakers) line += ` — ${speakers}`
    if (session.track) line += ` [${session.track.name}]`
    lines.push(line)
  }

  lines.push(markdownFooter({path: '/sessions'}))

  return markdownResponse(lines.join('\n'))
}
