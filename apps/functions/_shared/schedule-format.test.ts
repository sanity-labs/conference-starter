import {describe, it, expect} from 'vitest'
import {formatScheduleEmailHtml, formatScheduleTelegramHtml} from './schedule-format'
import type {DigestSlot} from './schedule-format'

const SITE_URL = 'https://example.com'

const slots: DigestSlot[] = [
  {
    startTime: '2026-10-15T13:00:00Z', // 9 AM ET
    endTime: '2026-10-15T13:45:00Z',
    isPlenary: true,
    room: {name: 'The Content Lake', floor: '1'},
    session: {
      title: 'Opening Keynote',
      slug: 'opening-keynote',
      sessionType: 'keynote',
      speakers: [{name: 'Knut Melvær'}],
    },
  },
  {
    startTime: '2026-10-15T13:45:00Z',
    endTime: '2026-10-15T14:00:00Z',
    isPlenary: false,
    room: null,
    session: {
      title: 'Coffee Break',
      slug: 'coffee-break',
      sessionType: 'break',
      speakers: null,
    },
  },
  {
    startTime: '2026-10-15T14:00:00Z',
    endTime: '2026-10-15T14:45:00Z',
    isPlenary: false,
    room: {name: 'The Schema Lab', floor: '2'},
    session: {
      title: 'Content Modeling Workshop',
      slug: 'content-modeling-workshop',
      sessionType: 'workshop',
      speakers: [{name: 'Simen Svale Skogsrud'}, {name: 'Espen Hovlandsdal'}],
    },
  },
]

describe('formatScheduleEmailHtml', () => {
  it('renders an HTML table', () => {
    const html = formatScheduleEmailHtml(slots, SITE_URL)
    expect(html).toContain('<table')
    expect(html).toContain('</table>')
  })

  it('includes session titles with links', () => {
    const html = formatScheduleEmailHtml(slots, SITE_URL)
    expect(html).toContain('href="https://example.com/sessions/opening-keynote"')
    expect(html).toContain('Opening Keynote')
  })

  it('renders breaks with italic styling', () => {
    const html = formatScheduleEmailHtml(slots, SITE_URL)
    expect(html).toContain('font-style:italic')
    expect(html).toContain('Coffee Break')
  })

  it('includes room names', () => {
    const html = formatScheduleEmailHtml(slots, SITE_URL)
    expect(html).toContain('The Schema Lab')
  })

  it('includes speaker names', () => {
    const html = formatScheduleEmailHtml(slots, SITE_URL)
    expect(html).toContain('Simen Svale Skogsrud, Espen Hovlandsdal')
  })

  it('renders empty state message', () => {
    const html = formatScheduleEmailHtml([], SITE_URL)
    expect(html).toContain('No sessions scheduled')
  })
})

describe('formatScheduleTelegramHtml', () => {
  it('renders as plain HTML (no table)', () => {
    const html = formatScheduleTelegramHtml(slots, SITE_URL)
    expect(html).not.toContain('<table')
  })

  it('includes session links', () => {
    const html = formatScheduleTelegramHtml(slots, SITE_URL)
    expect(html).toContain('href="https://example.com/sessions/opening-keynote"')
  })

  it('renders breaks in italic', () => {
    const html = formatScheduleTelegramHtml(slots, SITE_URL)
    expect(html).toContain('<i>Coffee Break</i>')
  })

  it('includes room names in parentheses', () => {
    const html = formatScheduleTelegramHtml(slots, SITE_URL)
    expect(html).toContain('(The Schema Lab)')
  })

  it('includes speaker names after dash', () => {
    const html = formatScheduleTelegramHtml(slots, SITE_URL)
    expect(html).toContain('Simen Svale Skogsrud, Espen Hovlandsdal')
  })

  it('renders empty state', () => {
    const html = formatScheduleTelegramHtml([], SITE_URL)
    expect(html).toContain('No sessions scheduled')
  })
})
