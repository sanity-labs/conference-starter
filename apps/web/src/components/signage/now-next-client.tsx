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
}: {
  slots: Slot[]
  roomName: string
  dayStart?: string
  dayEnd?: string
}) {
  const {current, next} = useNowCursor(slots, {dayStart, dayEnd})

  if (!current && !next) {
    return (
      <div style={{textAlign: 'center'}}>
        <p className="signage-eyebrow">{roomName}</p>
        <p className="signage-title" style={{marginTop: 'clamp(0.5rem, 1vmin, 1rem)'}}>
          No more sessions today
        </p>
        <p className="signage-meta" style={{marginTop: 'clamp(0.5rem, 1vmin, 1rem)'}}>
          Thanks for coming.
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: '1fr auto 1fr',
        gap: 'clamp(1rem, 2.5vmin, 3rem)',
        width: '100%',
        height: '100%',
      }}
    >
      <SlotPanel label="Now" slot={current} dim={!current} />
      <hr
        style={{
          border: 'none',
          borderTop: '1px solid var(--color-border)',
          margin: 0,
        }}
      />
      <SlotPanel label="Next" slot={next} dim={!next} />
    </div>
  )
}

function SlotPanel({label, slot, dim}: {label: string; slot: Slot | null; dim: boolean}) {
  if (!slot || !slot.session) {
    return (
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: dim ? 0.5 : 1}}>
        <p className="signage-eyebrow">{label}</p>
        <p className="signage-title" style={{marginTop: '0.5rem'}}>
          —
        </p>
      </div>
    )
  }

  const session = slot.session
  const speakers = session.speakers ?? []
  const time = `${formatTime(slot.startTime)}${slot.endTime ? ` – ${formatTime(slot.endTime)}` : ''}`

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: speakers.length > 0 ? 'auto 1fr' : '1fr',
        gap: 'clamp(1rem, 3vmin, 4rem)',
        alignItems: 'center',
      }}
    >
      {speakers.length > 0 && <SpeakerStack speakers={speakers} />}
      <div style={{display: 'flex', flexDirection: 'column', gap: 'clamp(0.5rem, 1vmin, 1rem)', minWidth: 0}}>
        <p className="signage-eyebrow">
          {label} · {time}
        </p>
        <h2 className="signage-title">{session.title}</h2>
        {speakers.length > 0 && (
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
            style={{
              width: 'clamp(8rem, 16vmin, 16rem)',
              height: 'clamp(8rem, 16vmin, 16rem)',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid var(--color-surface)',
              backgroundColor: 'var(--color-surface-alt)',
              marginLeft: idx === 0 ? 0 : '-2.5vmin',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            {url ? (
              <img
                src={url}
                alt={speaker.photo?.alt ?? speaker.name ?? ''}
                width={400}
                height={400}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(2rem, 5vmin, 5rem)',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                }}
              >
                {speaker.name?.[0] ?? '?'}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
