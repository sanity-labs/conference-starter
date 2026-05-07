'use client'

import {useMemo} from 'react'
import type {MULTI_ROOM_DAY_SLOTS_QUERY_RESULT} from '@repo/sanity-queries'
import {Carousel} from './carousel'
import {formatTime} from './conference-day'
import {useEffectiveNow} from './now-cursor'

type Slot = MULTI_ROOM_DAY_SLOTS_QUERY_RESULT[number]

type RoomFrame = {
  roomId: string
  roomName: string
  current: Slot | null
  next: Slot | null
}

export function HallwayCarouselClient({
  slots,
  lookaheadMinutes,
  dwellSeconds,
  transition,
  dayStart,
  dayEnd,
}: {
  slots: Slot[]
  lookaheadMinutes: number
  dwellSeconds: number
  transition: 'fade' | 'slide' | 'none'
  dayStart?: string
  dayEnd?: string
}) {
  const now = useEffectiveNow({dayStart, dayEnd})

  const cutoff = now + lookaheadMinutes * 60_000

  const frames = useMemo<RoomFrame[]>(() => {
    const byRoom = new Map<string, Slot[]>()
    for (const slot of slots) {
      const id = slot.room?._id
      if (!id) continue
      if (!byRoom.has(id)) byRoom.set(id, [])
      byRoom.get(id)!.push(slot)
    }

    const result: RoomFrame[] = []
    for (const [roomId, roomSlots] of byRoom) {
      const sorted = [...roomSlots]
        .filter((s) => s.startTime)
        .sort(
          (a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime(),
        )
      const current =
        sorted.find((slot) => {
          const start = new Date(slot.startTime!).getTime()
          const end = slot.endTime
            ? new Date(slot.endTime).getTime()
            : start + 60 * 60_000
          return start <= now && now < end
        }) ?? null
      const next =
        sorted.find((slot) => {
          const start = new Date(slot.startTime!).getTime()
          return start > now && start <= cutoff
        }) ?? null

      // Skip rooms with nothing happening now or soon
      if (!current && !next) continue
      const room = sorted[0]?.room
      result.push({
        roomId,
        roomName: room?.name ?? 'Unknown room',
        current,
        next,
      })
    }
    return result.sort((a, b) => a.roomName.localeCompare(b.roomName))
  }, [slots, now, cutoff])

  if (frames.length === 0) {
    return (
      <div style={{textAlign: 'center'}}>
        <p className="signage-eyebrow">All quiet</p>
        <p className="signage-title">Nothing scheduled in the next {lookaheadMinutes} minutes</p>
      </div>
    )
  }

  const items = frames.map((frame) => <RoomFrameView key={frame.roomId} frame={frame} />)

  return <Carousel items={items} dwellSeconds={dwellSeconds} transition={transition} />
}

function RoomFrameView({frame}: {frame: RoomFrame}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: 'auto 1fr 1fr',
        gap: 'clamp(1rem, 2.5vmin, 2.5rem)',
        width: '100%',
        height: '100%',
        padding: 'clamp(1rem, 3vmin, 4rem)',
      }}
    >
      <p className="signage-eyebrow" style={{fontSize: 'clamp(1rem, 2vmin, 2.25rem)'}}>
        {frame.roomName}
      </p>
      <SlotLine label="Now" slot={frame.current} />
      <SlotLine label="Next" slot={frame.next} />
    </div>
  )
}

function SlotLine({label, slot}: {label: string; slot: Slot | null}) {
  if (!slot || !slot.session) {
    return (
      <div style={{opacity: 0.45}}>
        <p
          style={{
            fontSize: 'clamp(0.875rem, 1.5vmin, 1.5rem)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
            margin: 0,
          }}
        >
          {label}
        </p>
        <p className="signage-title" style={{marginTop: '0.25rem'}}>
          —
        </p>
      </div>
    )
  }

  const time = `${formatTime(slot.startTime)}${slot.endTime ? ` – ${formatTime(slot.endTime)}` : ''}`
  const speakers = slot.session.speakers ?? []

  return (
    <div>
      <p
        style={{
          fontSize: 'clamp(0.875rem, 1.5vmin, 1.5rem)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: label === 'Now' ? 'var(--color-accent)' : 'var(--color-text-muted)',
          margin: 0,
          fontWeight: 700,
        }}
      >
        {label} · {time}
      </p>
      <p
        className="signage-title"
        style={{fontSize: 'clamp(1.5rem, 4vmin, 4rem)', marginTop: 'clamp(0.25rem, 0.75vmin, 0.75rem)'}}
      >
        {slot.session.title}
      </p>
      {speakers.length > 0 && (
        <p
          className="signage-meta"
          style={{fontSize: 'clamp(0.875rem, 1.6vmin, 1.5rem)', marginTop: '0.25rem'}}
        >
          {speakers.map((s) => s.name).filter(Boolean).join(', ')}
        </p>
      )}
    </div>
  )
}
