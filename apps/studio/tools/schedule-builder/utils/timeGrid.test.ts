import {describe, it, expect} from 'vitest'
import {tzOffset, generateTimeIntervals, getDayBounds, getRowSpan} from './timeGrid'

describe('tzOffset', () => {
  it('returns EDT offset for a summer/fall date', () => {
    expect(tzOffset('2026-10-15')).toBe('-04:00')
  })

  it('returns EST offset for a winter date (DST-safe)', () => {
    expect(tzOffset('2026-12-15')).toBe('-05:00')
  })

  it('handles other timezones', () => {
    expect(tzOffset('2026-06-15', 'Europe/Oslo')).toBe('+02:00')
    expect(tzOffset('2026-12-15', 'Europe/Oslo')).toBe('+01:00')
  })
})

describe('generateTimeIntervals', () => {
  it('uses the DST-correct offset in interval ISO strings', () => {
    const summer = generateTimeIntervals('2026-10-15', 9, 10)
    expect(summer[0].start).toBe('2026-10-15T09:00:00-04:00')

    const winter = generateTimeIntervals('2026-12-15', 9, 10)
    expect(winter[0].start).toBe('2026-12-15T09:00:00-05:00')
  })

  it('generates 4 intervals per hour with 1-based rows', () => {
    const intervals = generateTimeIntervals('2026-10-15', 9, 11)
    expect(intervals).toHaveLength(8)
    expect(intervals[0].row).toBe(1)
    expect(intervals[7].row).toBe(8)
    expect(intervals[0].label).toBe('9:00 AM')
    expect(intervals[2].label).toBe('9:30 AM')
  })
})

describe('getDayBounds', () => {
  it('uses the DST-correct offset', () => {
    expect(getDayBounds('2026-12-15')).toEqual({
      dayStart: '2026-12-15T00:00:00-05:00',
      dayEnd: '2026-12-15T23:59:59-05:00',
    })
  })
})

describe('getRowSpan', () => {
  it('spans one row per 15 minutes', () => {
    expect(getRowSpan('2026-10-15T09:00:00-04:00', '2026-10-15T09:45:00-04:00')).toBe(3)
  })

  it('never returns less than one row', () => {
    expect(getRowSpan('2026-10-15T09:00:00-04:00', '2026-10-15T09:05:00-04:00')).toBe(1)
  })
})
