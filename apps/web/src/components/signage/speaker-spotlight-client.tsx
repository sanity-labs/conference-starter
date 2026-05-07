'use client'

import type {SCHEDULE_DAY_QUERY_RESULT} from '@repo/sanity-queries'
import {urlForImage} from '@/sanity/image'
import {Carousel} from './carousel'
import {formatTime} from './conference-day'
import {useEffectiveNow} from './now-cursor'

type Slot = SCHEDULE_DAY_QUERY_RESULT[number]

export function SpeakerSpotlightClient({
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

  // Build per-speaker spotlight items from slots starting in the next lookahead window.
  // De-dupe by (slot+speaker) to allow multi-speaker sessions to surface each one.
  const items: React.ReactNode[] = []
  for (const slot of slots) {
    if (!slot.startTime) continue
    const start = new Date(slot.startTime).getTime()
    if (start < now || start >= cutoff) continue
    const speakers = slot.session?.speakers ?? []
    for (const speaker of speakers) {
      items.push(
        <SpeakerFrame
          key={`${slot._id}:${speaker._id}`}
          slot={slot}
          speaker={speaker}
        />,
      )
    }
  }

  if (items.length === 0) {
    return (
      <div style={{textAlign: 'center'}}>
        <p className="signage-eyebrow">Up next</p>
        <p className="signage-title">No speakers in the next {lookaheadMinutes} minutes</p>
        <p className="signage-meta" style={{marginTop: 'clamp(0.5rem, 1vmin, 1rem)'}}>
          Stretch your legs.
        </p>
      </div>
    )
  }

  return <Carousel items={items} dwellSeconds={dwellSeconds} transition={transition} />
}

function SpeakerFrame({
  slot,
  speaker,
}: {
  slot: Slot
  speaker: NonNullable<NonNullable<Slot['session']>['speakers']>[number]
}) {
  const url = urlForImage(speaker.photo)?.width(900).height(900).fit('crop').url() ?? null
  const session = slot.session
  const time = formatTime(slot.startTime)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 'clamp(2rem, 5vmin, 6rem)',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: 'clamp(1rem, 3vmin, 4rem)',
      }}
    >
      <div
        style={{
          width: 'clamp(14rem, 36vmin, 36rem)',
          height: 'clamp(14rem, 36vmin, 36rem)',
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: 'var(--color-surface-alt)',
          flexShrink: 0,
        }}
      >
        {url ? (
          <img
            src={url}
            alt={speaker.photo?.alt ?? speaker.name ?? ''}
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
              fontSize: 'clamp(4rem, 12vmin, 12rem)',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
            }}
          >
            {speaker.name?.[0] ?? '?'}
          </div>
        )}
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 'clamp(0.5rem, 1.5vmin, 1.5rem)', minWidth: 0}}>
        <p className="signage-eyebrow">
          {time}
          {slot.room?.name ? ` · ${slot.room.name}` : ''}
        </p>
        <h2 className="signage-title">{speaker.name}</h2>
        {(speaker.role || speaker.company) && (
          <p className="signage-meta">
            {[speaker.role, speaker.company].filter(Boolean).join(' · ')}
          </p>
        )}
        {session?.title && (
          <p
            style={{
              fontSize: 'clamp(1.25rem, 3vmin, 3rem)',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginTop: 'clamp(0.5rem, 1.5vmin, 1.5rem)',
              textWrap: 'balance',
            }}
          >
            {session.title}
          </p>
        )}
      </div>
    </div>
  )
}
