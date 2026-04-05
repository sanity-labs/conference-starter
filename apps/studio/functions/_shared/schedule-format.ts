/**
 * Format schedule slot data as HTML (email) and Telegram-safe HTML.
 * Slot shape matches the SCHEDULE_DIGEST_QUERY projection.
 */

import {escapeHTML} from '@portabletext/to-html'
import {buildUrl} from './url-builder'

export interface DigestSlot {
  startTime: string
  endTime: string
  isPlenary: boolean
  room: {name: string; floor: string | null} | null
  session: {
    title: string
    slug: string
    sessionType: string
    speakers: Array<{name: string}> | null
  } | null
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  })
}

function speakerNames(speakers: Array<{name: string}> | null): string {
  if (!speakers || speakers.length === 0) return ''
  return speakers.map((s) => s.name).join(', ')
}

/**
 * Render schedule slots as an HTML table for email.
 */
export function formatScheduleEmailHtml(slots: DigestSlot[], siteUrl: string): string {
  if (slots.length === 0) return '<p><em>No sessions scheduled.</em></p>'

  const rows = slots
    .map((slot) => {
      const session = slot.session
      if (!session) return ''
      const time = `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`
      const title = session.slug
        ? `<a href="${escapeHTML(`${siteUrl}/sessions/${session.slug}`)}">${escapeHTML(session.title)}</a>`
        : escapeHTML(session.title)
      const room = slot.room ? escapeHTML(slot.room.name) : ''
      const speakers = escapeHTML(speakerNames(session.speakers))
      const type = session.sessionType

      // Breaks and socials get a simpler row
      if (type === 'break' || type === 'social') {
        return `<tr><td style="padding:6px 8px;color:#666">${time}</td><td colspan="3" style="padding:6px 8px;color:#666;font-style:italic">${escapeHTML(session.title)}</td></tr>`
      }

      return `<tr><td style="padding:6px 8px">${time}</td><td style="padding:6px 8px"><strong>${title}</strong></td><td style="padding:6px 8px">${room}</td><td style="padding:6px 8px;color:#666">${speakers}</td></tr>`
    })
    .filter(Boolean)
    .join('\n')

  return `<table style="width:100%;border-collapse:collapse;margin:16px 0">
<thead><tr style="border-bottom:2px solid #e5e5e5;text-align:left">
<th style="padding:6px 8px">Time</th><th style="padding:6px 8px">Session</th><th style="padding:6px 8px">Room</th><th style="padding:6px 8px">Speakers</th>
</tr></thead>
<tbody>${rows}</tbody>
</table>`
}

/**
 * Render schedule slots as a Telegram-friendly HTML list.
 */
export function formatScheduleTelegramHtml(slots: DigestSlot[], siteUrl: string): string {
  if (slots.length === 0) return '<i>No sessions scheduled.</i>'

  return slots
    .map((slot) => {
      const session = slot.session
      if (!session) return ''
      const time = `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`
      const type = session.sessionType

      if (type === 'break' || type === 'social') {
        return `${time} — <i>${escapeHTML(session.title)}</i>`
      }

      const title = session.slug
        ? `<a href="${escapeHTML(`${siteUrl}/sessions/${session.slug}`)}">${escapeHTML(session.title)}</a>`
        : escapeHTML(session.title)
      const room = slot.room ? ` (${escapeHTML(slot.room.name)})` : ''
      const speakers = speakerNames(session.speakers)
      const speakerSuffix = speakers ? ` — ${escapeHTML(speakers)}` : ''

      return `${time}${room}\n<b>${title}</b>${speakerSuffix}`
    })
    .filter(Boolean)
    .join('\n\n')
}
