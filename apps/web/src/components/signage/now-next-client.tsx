'use client'

import type {ROOM_DAY_SLOTS_QUERY_RESULT} from '@repo/sanity-queries'
import {urlForImage} from '@/sanity/image'
import {useNowCursor} from './now-cursor'
import {formatTime} from './conference-day'

type Slot = ROOM_DAY_SLOTS_QUERY_RESULT[number]

export function NowNextClient({
  slots,
  roomName,
  dayStart,
  dayEnd,
  demoNowISO,
}: {
  slots: Slot[]
  roomName: string
  dayStart?: string
  dayEnd?: string
  demoNowISO?: string | null
}) {
  const {current, next} = useNowCursor(slots, {dayStart, dayEnd, demoNowISO})

  if (!current && !next) {
    return (
      <div className="signage-grid">
        <div
          style={{
            gridColumn: '2 / -2',
            display: 'grid',
            gap: 'clamp(0.5rem, 1.5vmin, 1.5rem)',
            justifyItems: 'start',
            alignContent: 'center',
          }}
        >
          <p className="signage-eyebrow">{roomName}</p>
          <p className="signage-title">No more sessions today</p>
          <p className="signage-meta">Thanks for coming.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: current ? '1fr auto 1fr' : 'auto auto 1fr',
        gap: 'clamp(1rem, 2.5vmin, 3rem)',
        width: '100%',
        height: '100%',
        alignContent: 'stretch',
      }}
    >
      <SlotPanel label="Now" slot={current} />
      <hr className="signage-divider" />
      <SlotPanel label="Next" slot={next} />
    </div>
  )
}

function SlotPanel({label, slot}: {label: string; slot: Slot | null}) {
  if (!slot || !slot.session) {
    return (
      <div
        className="signage-grid"
        style={{opacity: 0.55, alignContent: 'center'}}
      >
        <div style={{gridColumn: '1 / -1', display: 'grid', gap: 'clamp(0.5rem, 1vmin, 1rem)'}}>
          <p className="signage-eyebrow">{label}</p>
          <p className="signage-title" style={{fontSize: 'clamp(1.25rem, 3vmin, 3rem)'}}>
            —
          </p>
        </div>
      </div>
    )
  }

  const session = slot.session
  const speakers = session.speakers ?? []
  const time = `${formatTime(slot.startTime)}${slot.endTime ? ` – ${formatTime(slot.endTime)}` : ''}`
  const hasSpeakers = speakers.length > 0

  return (
    <div className="signage-grid" style={{alignContent: 'center'}}>
      {hasSpeakers && (
        <div
          style={{
            gridColumn: 'span 3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <SpeakerStack speakers={speakers} />
        </div>
      )}
      <div
        style={{
          gridColumn: hasSpeakers ? 'span 9' : '1 / -1',
          display: 'grid',
          gap: 'clamp(0.5rem, 1.2vmin, 1.5rem)',
          alignContent: 'center',
          minWidth: 0,
        }}
      >
        <p className="signage-eyebrow signage-time">
          {label} · {time}
        </p>
        <h2 className="signage-title">{session.title}</h2>
        {hasSpeakers && (
          <p className="signage-meta">
            {speakers
              .map((s) => [s.name, s.company].filter(Boolean).join(' · '))
              .filter(Boolean)
              .join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}

function SpeakerStack({
  speakers,
}: {
  speakers: NonNullable<NonNullable<Slot['session']>['speakers']>
}) {
  const visible = speakers.slice(0, 3)
  return (
    <div style={{display: 'flex', alignItems: 'center'}}>
      {visible.map((speaker, idx) => {
        const url = urlForImage(speaker.photo)?.width(400).height(400).fit('crop').url() ?? null
        return (
          <div
            key={speaker._id}
            className="signage-avatar"
            style={{
              width: 'clamp(8rem, 16vmin, 16rem)',
              height: 'clamp(8rem, 16vmin, 16rem)',
              marginLeft: idx === 0 ? 0 : '-2.5vmin',
            }}
          >
            {url ? (
              <img
                src={url}
                alt={speaker.photo?.alt ?? speaker.name ?? ''}
                width={400}
                height={400}
              />
            ) : (
              <div className="signage-avatar-fallback">{speaker.name?.[0] ?? '?'}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
