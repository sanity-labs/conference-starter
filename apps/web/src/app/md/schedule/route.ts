import {mdClient, markdownResponse, markdownHeader, markdownFooter} from '../_lib/response'
import {CONFERENCE_QUERY, SCHEDULE_DAY_QUERY} from '@repo/sanity-queries'

export async function GET() {
  const conference = await mdClient.fetch(CONFERENCE_QUERY)
  if (!conference?.startDate) {
    return markdownResponse('# Schedule\n\nSchedule not available yet.')
  }

  // Compute conference days
  const start = new Date(conference.startDate)
  const end = conference.endDate ? new Date(conference.endDate) : start
  const days: Date[] = []
  const current = new Date(start)
  current.setUTCHours(0, 0, 0, 0)
  const endDay = new Date(end)
  endDay.setUTCHours(0, 0, 0, 0)
  while (current <= endDay) {
    days.push(new Date(current))
    current.setUTCDate(current.getUTCDate() + 1)
  }

  const lines: string[] = []
  lines.push(markdownHeader(`${conference.name ?? 'Conference'} — Schedule`, {path: '/schedule'}))

  for (const day of days) {
    const dayStart = day.toISOString().split('T')[0] + 'T00:00:00Z'
    const nextDay = new Date(day)
    nextDay.setUTCDate(nextDay.getUTCDate() + 1)
    const dayEnd = nextDay.toISOString().split('T')[0] + 'T00:00:00Z'

    const slots = await mdClient.fetch(SCHEDULE_DAY_QUERY, {
      conferenceId: conference._id,
      dayStart,
      dayEnd,
    })

    const dayLabel = day.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })

    lines.push(`## ${dayLabel}`)

    if (!slots || slots.length === 0) {
      lines.push('No sessions scheduled.')
      continue
    }

    for (const slot of slots) {
      const session = slot.session
      if (!session) continue

      const time = slot.startTime
        ? new Date(slot.startTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/New_York',
          })
        : ''

      const endTime = slot.endTime
        ? new Date(slot.endTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/New_York',
          })
        : ''

      const timeRange = endTime ? `${time} — ${endTime}` : time
      const type = session.sessionType
        ? `[${session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)}]`
        : ''

      const isContent = !['break', 'social'].includes(session.sessionType ?? '')
      const title = isContent && session.slug
        ? `[${session.title}](/sessions/${session.slug}.md)`
        : session.title

      const speakers =
        session.speakers && session.speakers.length > 0
          ? session.speakers
              .map((s) => `[${s.name}](/speakers/${s.slug}.md)`)
              .join(', ')
          : null

      const room = slot.room?.name ?? ''

      let line = `- **${timeRange}** ${type} ${title}`
      if (speakers) line += ` — ${speakers}`
      if (room) line += ` *(${room})*`
      lines.push(line)
    }
  }

  lines.push(markdownFooter({path: '/schedule'}))

  return markdownResponse(lines.join('\n\n'))
}
