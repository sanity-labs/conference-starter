import {mdClient, markdownResponse, markdownHeader, markdownFooter} from '../_lib/response'
import {VENUE_QUERY} from '@repo/sanity-queries'
import {ptToMarkdown} from '@/lib/portable-text-markdown'

export async function GET() {
  const venue = await mdClient.fetch(VENUE_QUERY)
  if (!venue) {
    return markdownResponse('# Venue\n\nVenue information not available yet.')
  }

  const lines: string[] = []
  lines.push(markdownHeader(venue.name ?? 'Venue', {path: '/venue'}))

  if (venue.address) lines.push(venue.address)

  if (venue.description) lines.push(ptToMarkdown(venue.description as unknown[]))
  if (venue.mapUrl) lines.push(`[View map](${venue.mapUrl})`)

  if (venue.transitInfo) {
    lines.push('## Getting There')
    lines.push(ptToMarkdown(venue.transitInfo as unknown[]))
  }

  if (venue.wifiInfo) {
    lines.push('## Wi-Fi')
    const wifiParts = [
      venue.wifiInfo.network && `**Network:** ${venue.wifiInfo.network}`,
      venue.wifiInfo.password && `**Password:** ${venue.wifiInfo.password}`,
    ].filter(Boolean)
    if (wifiParts.length > 0) lines.push(wifiParts.join('  \n'))
  }

  // Rooms
  if (venue.rooms && venue.rooms.length > 0) {
    lines.push('## Rooms')
    for (const room of venue.rooms) {
      let roomLine = `### ${room.name}`
      const details = [
        room.floor && `Floor: ${room.floor}`,
        room.capacity && `Capacity: ${room.capacity}`,
      ].filter(Boolean)
      if (details.length > 0) roomLine += `\n${details.join(' · ')}`

      if (room.amenities && room.amenities.length > 0) {
        roomLine += `\nAmenities: ${room.amenities.join(', ')}`
      }

      lines.push(roomLine)

      // Room schedule
      if (room.schedule && room.schedule.length > 0) {
        const sessionLines = room.schedule
          .filter((s) => s.session)
          .map((s) => {
            const time = s.startTime
              ? new Date(s.startTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: 'America/New_York',
                })
              : ''
            const isContent = !['break', 'social'].includes(s.session!.sessionType ?? '')
            const title = isContent && s.session!.slug
              ? `[${s.session!.title}](/sessions/${s.session!.slug}.md)`
              : s.session!.title
            return `- ${time} ${title}`
          })
        if (sessionLines.length > 0) {
          lines.push(sessionLines.join('\n'))
        }
      }
    }
  }

  lines.push(markdownFooter({path: '/venue'}))

  return markdownResponse(lines.join('\n\n'))
}
