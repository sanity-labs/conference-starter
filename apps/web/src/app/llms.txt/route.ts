import {client} from '@/sanity/client'
import {CONFERENCE_QUERY, SPEAKERS_QUERY, SESSIONS_SUMMARY_QUERY, FAQ_QUERY} from '@repo/sanity-queries'
import {SITE_URL} from '@/lib/metadata'

export async function GET() {
  const [conference, speakers, sessions, faqs] = await Promise.all([
    client.fetch(CONFERENCE_QUERY),
    client.fetch(SPEAKERS_QUERY),
    client.fetch(SESSIONS_SUMMARY_QUERY),
    client.fetch(FAQ_QUERY),
  ])

  const lines: string[] = []

  // Header
  lines.push(`# ${conference?.name ?? 'Conference'}`)
  lines.push('')
  if (conference?.tagline) lines.push(`> ${conference.tagline}`)
  if (conference?.description) lines.push(`> ${conference.description}`)
  lines.push('')

  // Dates & Venue
  if (conference?.startDate) {
    const start = new Date(conference.startDate).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    const end = conference.endDate
      ? new Date(conference.endDate).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : null
    lines.push(`## Dates`)
    lines.push(end ? `${start} — ${end}` : start)
    lines.push('')
  }

  if (conference?.venue) {
    lines.push(`## Venue`)
    lines.push(`${conference.venue.name}${conference.venue.address ? `, ${conference.venue.address}` : ''}`)
    lines.push('')
  }

  // Tracks
  if (conference?.tracks && conference.tracks.length > 0) {
    lines.push(`## Tracks`)
    for (const track of conference.tracks) {
      lines.push(`- ${track.name}`)
    }
    lines.push('')
  }

  // Sessions
  if (sessions && sessions.length > 0) {
    lines.push(`## Sessions (${sessions.length} total)`)
    for (const session of sessions) {
      const type = session.sessionType ? ` [${session.sessionType}]` : ''
      lines.push(`- ${session.title}${type}: ${SITE_URL}/sessions/${session.slug}`)
    }
    lines.push('')
  }

  // Speakers
  if (speakers && speakers.length > 0) {
    lines.push(`## Speakers (${speakers.length})`)
    for (const speaker of speakers) {
      const info = [speaker.role, speaker.company].filter(Boolean).join(', ')
      lines.push(`- ${speaker.name}${info ? ` — ${info}` : ''}: ${SITE_URL}/speakers/${speaker.slug}`)
    }
    lines.push('')
  }

  // FAQ
  if (faqs && faqs.length > 0) {
    lines.push(`## FAQ`)
    for (const faq of faqs) {
      if (!faq.question) continue
      lines.push(`### ${faq.question}`)
      // Extract plain text from portable text blocks
      if (faq.answer) {
        const text = faq.answer
          .filter((b: Record<string, unknown>) => b._type === 'block')
          .map((b: Record<string, unknown>) =>
            (b.children as Array<{text?: string}>)?.map((c) => c.text ?? '').join('') ?? '',
          )
          .filter(Boolean)
          .join(' ')
        if (text) lines.push(text)
      }
      lines.push('')
    }
  }

  // Key pages
  lines.push(`## Pages`)
  lines.push(`- Home: ${SITE_URL}`)
  lines.push(`- Schedule: ${SITE_URL}/schedule`)
  lines.push(`- Sessions: ${SITE_URL}/sessions`)
  lines.push(`- Speakers: ${SITE_URL}/speakers`)
  lines.push(`- Venue: ${SITE_URL}/venue`)
  lines.push(`- FAQ: ${SITE_URL}/faq`)
  lines.push(`- Sponsors: ${SITE_URL}/sponsors`)
  lines.push(`- Announcements: ${SITE_URL}/announcements`)
  lines.push('')

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
