const CONFERENCE_TZ = 'America/New_York'
const TZ_OFFSET = '-04:00'

function todayInTz(): string {
  return new Date().toLocaleDateString('en-CA', {timeZone: CONFERENCE_TZ})
}

export function resolveConferenceDay(opts: {
  startDate?: string | null
  endDate?: string | null
  override?: string
}): {date: string; dayStart: string; dayEnd: string} {
  const today = todayInTz()
  const startSlice = opts.startDate?.slice(0, 10)
  const endSlice = opts.endDate?.slice(0, 10) ?? startSlice

  let date = opts.override ?? today
  if (!opts.override && startSlice && endSlice) {
    if (today < startSlice) date = startSlice
    else if (today > endSlice) date = endSlice
  }

  return {
    date,
    dayStart: `${date}T00:00:00${TZ_OFFSET}`,
    dayEnd: `${date}T23:59:59${TZ_OFFSET}`,
  }
}

export function formatTime(value?: string | null): string {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: CONFERENCE_TZ,
  })
}

export function formatDateRange(start?: string | null, end?: string | null): string {
  if (!start) return ''
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : startDate
  const sameMonth = startDate.getUTCMonth() === endDate.getUTCMonth()
  const startMonth = startDate.toLocaleDateString('en-US', {month: 'long', timeZone: 'UTC'})
  const startDay = startDate.toLocaleDateString('en-US', {day: 'numeric', timeZone: 'UTC'})
  const endDay = endDate.toLocaleDateString('en-US', {day: 'numeric', timeZone: 'UTC'})
  const year = endDate.toLocaleDateString('en-US', {year: 'numeric', timeZone: 'UTC'})
  if (start === end || startDay === endDay) return `${startMonth} ${startDay}, ${year}`
  if (sameMonth) return `${startMonth} ${startDay}–${endDay}, ${year}`
  const endMonth = endDate.toLocaleDateString('en-US', {month: 'long', timeZone: 'UTC'})
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`
}
