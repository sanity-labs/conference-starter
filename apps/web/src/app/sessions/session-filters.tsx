'use client'

import {useSearchParams, useRouter, usePathname} from 'next/navigation'
import {useCallback, useMemo} from 'react'
import Link from 'next/link'
import type {SESSIONS_LISTING_QUERY_RESULT} from '@repo/sanity-queries'
import {SanityImage} from '@/components/sanity-image'

type Session = SESSIONS_LISTING_QUERY_RESULT[number]

export function SessionFilters({
  sessions,
  tracks,
  sessionTypes,
  levels,
}: {
  sessions: SESSIONS_LISTING_QUERY_RESULT
  tracks: Array<{slug: string; name: string}>
  sessionTypes: string[]
  levels: string[]
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const activeTrack = searchParams.get('track')
  const activeType = searchParams.get('type')
  const activeLevel = searchParams.get('level')

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, {scroll: false})
    },
    [searchParams, router, pathname],
  )

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (activeTrack && s.track?.slug !== activeTrack) return false
      if (activeType && s.sessionType !== activeType) return false
      if (activeLevel && s.level !== activeLevel) return false
      return true
    })
  }, [sessions, activeTrack, activeType, activeLevel])

  const activeTrackData = activeTrack ? tracks.find((t) => t.slug === activeTrack) : null

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-6">
        <FilterGroup
          label="Track"
          options={tracks.map((t) => ({value: t.slug, label: t.name}))}
          active={activeTrack}
          onSelect={(v) => setFilter('track', v)}
        />
        <FilterGroup
          label="Type"
          options={sessionTypes.map((t) => ({value: t, label: capitalize(t)}))}
          active={activeType}
          onSelect={(v) => setFilter('type', v)}
        />
        <FilterGroup
          label="Level"
          options={levels.map((l) => ({value: l, label: capitalize(l)}))}
          active={activeLevel}
          onSelect={(v) => setFilter('level', v)}
        />
      </div>

      {activeTrackData && (
        <p className="mt-4 text-sm text-text-secondary">
          Showing sessions in <strong>{activeTrackData.name}</strong>
        </p>
      )}

      <p className="mt-4 text-sm text-text-muted">
        {filtered.length} session{filtered.length !== 1 ? 's' : ''}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-8 text-text-muted">No sessions match the selected filters.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((session) => (
            <SessionCard key={session._id} session={session} />
          ))}
        </ul>
      )}
    </div>
  )
}

function FilterGroup({
  label,
  options,
  active,
  onSelect,
}: {
  label: string
  options: Array<{value: string; label: string}>
  active: string | null
  onSelect: (value: string | null) => void
}) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isActive = active === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(isActive ? null : opt.value)}
              className={`rounded-full border px-3 py-1 text-sm ${
                isActive
                  ? 'border-border-strong bg-surface-alt text-text-primary'
                  : 'border-border text-text-secondary hover:border-border-strong hover:text-text-primary'
              }`}
              aria-pressed={isActive}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function SessionCard({session}: {session: Session}) {
  return (
    <li className="rounded-md border border-border p-4 hover:border-border-strong">
      <Link href={`/sessions/${session.slug}`} className="font-medium hover:underline">
        {session.title}
      </Link>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-text-muted">
        {session.sessionType && (
          <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium">
            {capitalize(session.sessionType)}
          </span>
        )}
        {session.track && (
          <Link
            href={`/sessions?track=${session.track.slug}`}
            className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium hover:text-text-primary"
          >
            {session.track.name}
          </Link>
        )}
        {session.level && <span>{capitalize(session.level)}</span>}
        {session.duration && <span>{session.duration} min</span>}
      </div>

      {session.speakers && session.speakers.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-3">
          {session.speakers.map((speaker) => (
            <li key={speaker._id} className="flex items-center gap-2 text-sm">
              {speaker.photo && (
                <SanityImage
                  value={speaker.photo}
                  className="h-6 w-6 rounded-full object-cover"
                  width={48}
                  height={48}
                  sizes="24px"
                />
              )}
              <Link href={`/speakers/${speaker.slug}`} className="hover:underline">
                {speaker.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {session.slot?.startTime && (
        <p className="mt-2 text-xs text-text-muted">
          <time dateTime={session.slot.startTime}>
            {new Date(session.slot.startTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              timeZone: 'America/New_York',
            })}
          </time>
          {session.slot.room?.name && (
            <>
              {' · '}
              <Link href={`/venue#room-${session.slot.room.slug}`} className="hover:underline">
                {session.slot.room.name}
              </Link>
            </>
          )}
        </p>
      )}
    </li>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
