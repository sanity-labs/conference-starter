import {describe, it, expect} from 'vitest'
import {
  toDateString,
  daysBetween,
  isConferenceDay,
  formatDateForDisplay,
  formatDatetimeForDisplay,
  daysUntilLabel,
} from './conference-date-utils'

const TZ = 'America/New_York'

describe('toDateString', () => {
  it('converts ISO datetime to YYYY-MM-DD in timezone', () => {
    // 2026-10-15 at noon UTC → still Oct 15 in ET
    expect(toDateString('2026-10-15T12:00:00Z', TZ)).toBe('2026-10-15')
  })

  it('handles timezone offset near midnight', () => {
    // 2026-10-16 at 02:00 UTC → Oct 15 at 10pm ET (UTC-4 in October)
    expect(toDateString('2026-10-16T02:00:00Z', TZ)).toBe('2026-10-15')
  })

  it('handles midnight UTC → previous day in western timezone', () => {
    // 2026-10-16 at 00:00 UTC → Oct 15 at 8pm ET
    expect(toDateString('2026-10-16T00:00:00Z', TZ)).toBe('2026-10-15')
  })
})

describe('daysBetween', () => {
  it('returns 0 for same date', () => {
    expect(daysBetween('2026-10-15', '2026-10-15')).toBe(0)
  })

  it('returns positive for future date', () => {
    expect(daysBetween('2026-10-15', '2026-10-17')).toBe(2)
  })

  it('returns negative for past date', () => {
    expect(daysBetween('2026-10-17', '2026-10-15')).toBe(-2)
  })

  it('handles 1 day difference', () => {
    expect(daysBetween('2026-10-15', '2026-10-16')).toBe(1)
  })

  it('handles 7 day difference', () => {
    expect(daysBetween('2026-10-08', '2026-10-15')).toBe(7)
  })

  it('handles month boundary', () => {
    expect(daysBetween('2026-09-30', '2026-10-01')).toBe(1)
  })
})

describe('isConferenceDay', () => {
  const start = '2026-10-15T09:00:00Z'
  const end = '2026-10-16T18:00:00Z'

  it('returns true for first day', () => {
    expect(isConferenceDay('2026-10-15', start, end, TZ)).toBe(true)
  })

  it('returns true for last day', () => {
    expect(isConferenceDay('2026-10-16', start, end, TZ)).toBe(true)
  })

  it('returns false for day before', () => {
    expect(isConferenceDay('2026-10-14', start, end, TZ)).toBe(false)
  })

  it('returns false for day after', () => {
    expect(isConferenceDay('2026-10-17', start, end, TZ)).toBe(false)
  })
})

describe('formatDateForDisplay', () => {
  it('formats as "Weekday, Month Day"', () => {
    const result = formatDateForDisplay('2026-10-15')
    expect(result).toBe('Thursday, October 15')
  })

  it('formats another date', () => {
    const result = formatDateForDisplay('2026-06-01')
    expect(result).toBe('Monday, June 1')
  })
})

describe('formatDatetimeForDisplay', () => {
  it('formats as "Month Day, Year"', () => {
    const result = formatDatetimeForDisplay('2026-08-15T23:59:00Z')
    expect(result).toMatch(/August 15, 2026/)
  })
})

describe('daysUntilLabel', () => {
  it('returns "tomorrow" for 1 day', () => {
    expect(daysUntilLabel(1)).toBe('tomorrow')
  })

  it('returns "1 week" for 7 days', () => {
    expect(daysUntilLabel(7)).toBe('1 week')
  })

  it('returns "N days" for other values', () => {
    expect(daysUntilLabel(2)).toBe('2 days')
    expect(daysUntilLabel(3)).toBe('3 days')
    expect(daysUntilLabel(14)).toBe('14 days')
  })
})
