'use client'

import type {SCHEDULE_DAY_QUERY_RESULT} from '@repo/sanity-queries'
import {useNowCursor} from './now-cursor'
import {formatTime} from './conference-day'

type Slot = SCHEDULE_DAY_QUERY_RESULT[number]

export function DayAgendaClient({
  slots,
  dayStart,
  dayEnd,
}: {
  slots: Slot[]
  dayStart?: string
  dayEnd?: string
}) {
  const {current, done} = useNowCursor(slots, {dayStart, dayEnd})
  const doneIds = new Set(done.map((s) => s._id))
  const currentId = current?._id

  if (slots.length === 0) {
    return (
      <div className="signage-grid">
        <div
          style={{
            gridColumn: '2 / -2',
            display: 'grid',
            gap: 'clamp(0.5rem, 1vmin, 1rem)',
            alignContent: 'center',
            justifyItems: 'start',
          }}
        >
          <p className="signage-eyebrow">Today</p>
          <p className="signage-title">No sessions scheduled</p>
        </div>
      </div>
    )
  }

  // Group by start time, preserve order
  const groups = new Map<string, Slot[]>()
  for (const slot of slots) {
    if (!slot.startTime) continue
    if (!groups.has(slot.startTime)) groups.set(slot.startTime, [])
    groups.get(slot.startTime)!.push(slot)
  }

  return (
    <ol
      role="list"
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        width: '100%',
        height: '100%',
        display: 'grid',
        gridAutoRows: 'min-content',
        gap: 'clamp(0.6rem, 1.4vmin, 1.4rem)',
        alignContent: 'start',
        overflow: 'hidden',
      }}
    >
      {Array.from(groups.entries()).map(([time, items]) => (
        <li key={time} className="signage-grid" style={{alignContent: 'start'}}>
          <time
            dateTime={time}
            className="signage-eyebrow signage-time"
            style={{
              gridColumn: 'span 2',
              fontSize: 'clamp(1rem, 2vmin, 2.25rem)',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              alignSelf: 'baseline',
            }}
          >
            {formatTime(time)}
          </time>
          <ul
            role="list"
            style={{
              gridColumn: 'span 10',
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gap: 'clamp(0.4rem, 0.9vmin, 0.9rem)',
            }}
          >
            {items.map((slot) => (
              <SlotRow
                key={slot._id}
                slot={slot}
                isDone={doneIds.has(slot._id)}
                isCurrent={slot._id === currentId}
              />
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

function SlotRow({
  slot,
  isDone,
  isCurrent,
}: {
  slot: Slot
  isDone: boolean
  isCurrent: boolean
}) {
  return (
    <li
      style={{
        opacity: isDone ? 0.4 : 1,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        alignItems: 'baseline',
        columnGap: 'clamp(0.75rem, 2vmin, 2rem)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 'clamp(1rem, 2.2vmin, 2.25rem)',
          fontWeight: isCurrent ? 600 : 500,
          color: isCurrent ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          letterSpacing: isCurrent ? '-0.005em' : '0',
          textWrap: 'balance',
          display: 'inline-flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          gap: 'clamp(0.5rem, 1.2vmin, 1.2rem)',
          minWidth: 0,
        }}
      >
        {isCurrent && (
          <span
            style={{
              fontSize: '0.7em',
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              fontWeight: 700,
            }}
          >
            Now
          </span>
        )}
        <span style={{minWidth: 0}}>{slot.session?.title ?? '—'}</span>
      </p>
      {slot.room?.name && (
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(0.875rem, 1.5vmin, 1.5rem)',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {slot.room.name}
        </p>
      )}
    </li>
  )
}
