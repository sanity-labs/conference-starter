import type {TimeInterval} from '../types'
import type {SlotData} from '../types'

const TIMEZONE = 'America/New_York'
export const INTERVAL_MINUTES = 15
/** Height of one 15-minute grid row in px — shared by grid rows and pointer math */
export const ROW_HEIGHT_PX = 24

const offsetCache = new Map<string, string>()

/**
 * UTC offset string (e.g. "-04:00" or "-05:00") for a calendar date in the
 * conference timezone. DST-safe: derived via Intl rather than hardcoded.
 */
export function tzOffset(dateStr: string, timeZone: string = TIMEZONE): string {
  const cacheKey = `${dateStr}:${timeZone}`
  const cached = offsetCache.get(cacheKey)
  if (cached) return cached

  // Noon UTC is unambiguous for deriving the offset of that calendar date
  const probe = new Date(`${dateStr}T12:00:00Z`)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  }).formatToParts(probe)
  const name = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
  // "GMT-4", "GMT-04:00", or "GMT" (UTC)
  const match = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  const offset = match
    ? `${match[1]}${match[2].padStart(2, '0')}:${match[3] ?? '00'}`
    : '+00:00'
  offsetCache.set(cacheKey, offset)
  return offset
}

/**
 * Generate 15-minute time intervals for a given day.
 * Default range: 8:00 AM to 6:00 PM (covers typical conference hours).
 */
export function generateTimeIntervals(
  dateStr: string,
  startHour = 8,
  endHour = 18,
): TimeInterval[] {
  const intervals: TimeInterval[] = []
  const offset = tzOffset(dateStr)
  let row = 1

  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += INTERVAL_MINUTES) {
      const hh = String(hour).padStart(2, '0')
      const mm = String(min).padStart(2, '0')
      const iso = `${dateStr}T${hh}:${mm}:00${offset}`

      const label = new Date(iso).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: TIMEZONE,
      })

      intervals.push({start: iso, label, row})
      row++
    }
  }

  return intervals
}

/**
 * Compute the optimal start/end hours for the grid based on actual slot data.
 * Falls back to 8AM–6PM when no slots exist.
 */
export function computeTimeRange(slots: SlotData[]): {startHour: number; endHour: number} {
  if (slots.length === 0) return {startHour: 8, endHour: 18}

  let minHour = 23
  let maxHour = 0

  for (const slot of slots) {
    if (!slot.startTime || !slot.endTime) continue

    const startDate = new Date(slot.startTime)
    const endDate = new Date(slot.endTime)

    const startStr = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: TIMEZONE,
    })
    const endStr = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
      timeZone: TIMEZONE,
    })

    const sHour = parseInt(startStr, 10)
    // For end time, round up if there are minutes past the hour
    const [eHour, eMin] = endStr.split(':').map(Number)
    const effectiveEndHour = eMin > 0 ? eHour + 1 : eHour

    if (sHour < minHour) minHour = sHour
    if (effectiveEndHour > maxHour) maxHour = effectiveEndHour
  }

  if (minHour > maxHour) return {startHour: 8, endHour: 18}

  const startHour = Math.max(7, minHour)
  const endHour = Math.min(22, maxHour + 1)

  return {startHour, endHour}
}

/**
 * Get the row index (1-based) for a given ISO datetime within the intervals.
 * Returns the closest matching interval row.
 */
export function getRowForTime(time: string, intervals: TimeInterval[]): number {
  const t = new Date(time).getTime()
  for (let i = intervals.length - 1; i >= 0; i--) {
    if (t >= new Date(intervals[i].start).getTime()) {
      return intervals[i].row
    }
  }
  return 1
}

/**
 * Calculate how many grid rows a slot spans based on duration in minutes.
 */
export function getRowSpan(startTime: string, endTime: string): number {
  const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime()
  const diffMin = diffMs / (1000 * 60)
  return Math.max(1, Math.round(diffMin / INTERVAL_MINUTES))
}

/**
 * Get conference day strings from start/end dates.
 * Returns an array of "YYYY-MM-DD" date strings.
 */
export function getConferenceDays(startDate: string, endDate: string): string[] {
  const days: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Use UTC date parts to avoid timezone shifting
  const current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))

  while (current <= last) {
    const y = current.getUTCFullYear()
    const m = String(current.getUTCMonth() + 1).padStart(2, '0')
    const d = String(current.getUTCDate()).padStart(2, '0')
    days.push(`${y}-${m}-${d}`)
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return days
}

/**
 * Compute day start/end boundaries for GROQ filtering.
 */
export function getDayBounds(dateStr: string): {dayStart: string; dayEnd: string} {
  const offset = tzOffset(dateStr)
  return {
    dayStart: `${dateStr}T00:00:00${offset}`,
    dayEnd: `${dateStr}T23:59:59${offset}`,
  }
}

/**
 * Format a date string for display as a day label.
 */
export function formatDayLabel(dateStr: string): string {
  // Parse as UTC to avoid timezone shifting
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * "YYYY-MM-DD" of the current moment in the conference timezone —
 * used to decide whether to render the now-line.
 */
export function todayInTimezone(timeZone: string = TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
