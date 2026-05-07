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
      <div style={{textAlign: 'center'}}>
        <p className="signage-eyebrow">Today</p>
        <p className="signage-title">No sessions scheduled</p>
      </div>
    )
  }

  // Group by start time
  const groups = new Map<string, Slot[]>()
  for (const slot of slots) {
    if (!slot.startTime) continue
    if (!groups.has(slot.startTime)) groups.set(slot.startTime, [])
    groups.get(slot.startTime)!.push(slot)
  }

  return (
    <ol
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        width: '100%',
        height: '100%',
        display: 'grid',
        gridAutoRows: 'min-content',
        gap: 'clamp(0.5rem, 1.5vmin, 1.5rem)',
        overflow: 'hidden',
      }}
    >
      {Array.from(groups.entries()).map(([time, items]) => (
        <li
          key={time}
          style={{
            display: 'grid',
            gridTemplateColumns: 'min-content 1fr',
            gap: 'clamp(1rem, 3vmin, 3rem)',
            alignItems: 'baseline',
          }}
        >
          <time
            dateTime={time}
            style={{
              fontSize: 'clamp(1rem, 2.4vmin, 2.5rem)',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {formatTime(time)}
          </time>
          <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'clamp(0.5rem, 1vmin, 1rem)'}}>
            {items.map((slot) => {
              const isDone = doneIds.has(slot._id)
              const isCurrent = slot._id === currentId
              return (
                <li
                  key={slot._id}
                  style={{
                    opacity: isDone ? 0.4 : 1,
                    fontSize: 'clamp(1rem, 2.2vmin, 2.25rem)',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'baseline',
                    gap: 'clamp(0.5rem, 1.5vmin, 1.5rem)',
                  }}
                >
                  {isCurrent && (
                    <span
                      style={{
                        fontSize: '0.7em',
                        color: 'var(--color-accent)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        fontWeight: 700,
                      }}
                    >
                      Now
                    </span>
                  )}
                  <span style={{flex: '1 1 auto', minWidth: 0}}>{slot.session?.title ?? '—'}</span>
                  {slot.room?.name && (
                    <span style={{fontSize: '0.7em', color: 'var(--color-text-muted)'}}>{slot.room.name}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </li>
      ))}
    </ol>
  )
}
