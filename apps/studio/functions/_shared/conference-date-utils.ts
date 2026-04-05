/**
 * Pure date-math helpers for scheduled functions.
 * All comparisons use calendar dates in the conference timezone.
 */

/**
 * Get "today" as a YYYY-MM-DD string in the given timezone.
 */
export function getTodayInTimezone(timezone: string): string {
  return new Date().toLocaleDateString('en-CA', {timeZone: timezone}) // en-CA → YYYY-MM-DD
}

/**
 * Convert a Sanity datetime string to a YYYY-MM-DD date string in the given timezone.
 */
export function toDateString(isoDatetime: string, timezone: string): string {
  return new Date(isoDatetime).toLocaleDateString('en-CA', {timeZone: timezone})
}

/**
 * Signed number of calendar days from `from` to `to`.
 * Positive means `to` is in the future relative to `from`.
 */
export function daysBetween(from: string, to: string): number {
  const msPerDay = 86_400_000
  const fromMs = new Date(`${from}T00:00:00Z`).getTime()
  const toMs = new Date(`${to}T00:00:00Z`).getTime()
  return Math.round((toMs - fromMs) / msPerDay)
}

/**
 * Is `today` between startDate and endDate (inclusive)?
 */
export function isConferenceDay(
  today: string,
  startDate: string,
  endDate: string,
  timezone: string,
): boolean {
  const start = toDateString(startDate, timezone)
  const end = toDateString(endDate, timezone)
  return today >= start && today <= end
}

/**
 * Format a YYYY-MM-DD date string for display: "Monday, June 15"
 */
export function formatDateForDisplay(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00Z`) // noon UTC to avoid DST edge cases
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format an ISO datetime for display: "March 30, 2026"
 */
export function formatDatetimeForDisplay(isoDatetime: string): string {
  return new Date(isoDatetime).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Human-friendly "days until" label: "tomorrow", "2 days", "1 week"
 */
export function daysUntilLabel(days: number): string {
  if (days === 1) return 'tomorrow'
  if (days === 7) return '1 week'
  return `${days} days`
}
