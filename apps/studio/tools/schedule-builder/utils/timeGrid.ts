import type {TimeInterval} from '../types'

const TIMEZONE = 'America/New_York'
const INTERVAL_MINUTES = 15

/**
 * Generate 15-minute time intervals for a given day.
 * Default range: 8:00 AM to 8:00 PM (covers typical conference hours).
 */
export function generateTimeIntervals(
  dateStr: string,
  startHour = 8,
  endHour = 20,
): TimeInterval[] {
  const intervals: TimeInterval[] = []
  let row = 1

  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += INTERVAL_MINUTES) {
      const hh = String(hour).padStart(2, '0')
      const mm = String(min).padStart(2, '0')
      // Build ISO string in NYC timezone (EDT = -04:00)
      const iso = `${dateStr}T${hh}:${mm}:00-04:00`

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
  return {
    dayStart: `${dateStr}T00:00:00-04:00`,
    dayEnd: `${dateStr}T23:59:59-04:00`,
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
