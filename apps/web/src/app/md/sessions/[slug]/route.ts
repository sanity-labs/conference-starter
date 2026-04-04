import {mdClient, markdownResponse, markdownHeader, markdownFooter} from '../../_lib/response'
import {SESSION_DETAIL_QUERY} from '@repo/sanity-queries'
import {ptToMarkdown} from '@/lib/portable-text-markdown'

export async function GET(_req: Request, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const session = await mdClient.fetch(SESSION_DETAIL_QUERY, {slug})
  if (!session) return new Response('Not found', {status: 404})

  const speakerNames = session.speakers?.map((s) => s.name).filter(Boolean) ?? []
  const description = speakerNames.length > 0
    ? `${session.sessionType ?? 'Session'} by ${speakerNames.join(', ')}`
    : undefined

  const lines: string[] = []
  lines.push(markdownHeader(session.title ?? 'Session', {
    path: `/sessions/${slug}`,
    description,
  }))

  // Metadata line
  const meta = [
    session.sessionType &&
      session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1),
    session.level,
    session.duration && `${session.duration} min`,
  ].filter(Boolean)
  if (meta.length > 0) lines.push(meta.join(' · '))

  // Track
  if (session.track) {
    lines.push(`**Track:** [${session.track.name}](/sessions.md?track=${session.track.slug})`)
  }

  // Schedule
  if (session.slot?.startTime) {
    const start = new Date(session.slot.startTime)
    const datePart = start.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/New_York',
    })
    const timePart = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
    })
    let schedule = `**When:** ${datePart} at ${timePart}`
    if (session.slot.endTime) {
      const end = new Date(session.slot.endTime)
      schedule += ` — ${end.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York',
      })}`
    }
    if (session.slot.room) {
      schedule += `  \n**Where:** ${session.slot.room.name}`
      if (session.slot.room.floor) schedule += ` (${session.slot.room.floor})`
    }
    lines.push(schedule)
  }

  // Speakers
  if (session.speakers && session.speakers.length > 0) {
    lines.push(`## ${session.speakers.length === 1 ? 'Speaker' : 'Speakers'}`)
    for (const speaker of session.speakers) {
      const info = [speaker.role, speaker.company].filter(Boolean).join(', ')
      lines.push(
        `- [${speaker.name}](/speakers/${speaker.slug}.md)${info ? ` — ${info}` : ''}`,
      )
    }
  }

  if (session.moderator) {
    lines.push(`**Moderated by:** [${session.moderator.name}](/speakers/${session.moderator.slug}.md)`)
  }

  // Abstract
  if (session.abstract) {
    lines.push('## About this session')
    lines.push(ptToMarkdown(session.abstract as unknown[]))
  }

  // Workshop details
  if (session.sessionType === 'workshop') {
    const workshopParts: string[] = []
    if (session.capacity) workshopParts.push(`**Capacity:** ${session.capacity} participants`)
    if (session.prerequisites) workshopParts.push(`**Prerequisites:** ${session.prerequisites}`)
    if (session.materials && session.materials.length > 0) {
      workshopParts.push('**Materials:**')
      for (const m of session.materials) {
        workshopParts.push(`- [${m.title}](${m.url})${m.type ? ` (${m.type})` : ''}`)
      }
    }
    if (workshopParts.length > 0) {
      lines.push('## Workshop Details')
      lines.push(workshopParts.join('\n'))
    }
  }

  // Resources
  if (session.slidesUrl || session.recordingUrl) {
    lines.push('## Resources')
    if (session.slidesUrl) lines.push(`- [View slides](${session.slidesUrl})`)
    if (session.recordingUrl) lines.push(`- [Watch recording](${session.recordingUrl})`)
  }

  lines.push(markdownFooter({path: `/sessions/${slug}`, parent: {label: 'All sessions', href: '/sessions.md'}}))

  return markdownResponse(lines.join('\n\n'))
}
