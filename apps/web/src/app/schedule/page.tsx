import {Suspense} from 'react'
import Link from 'next/link'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {CONFERENCE_QUERY, SCHEDULE_DAY_QUERY} from '@repo/sanity-queries'
import type {SCHEDULE_DAY_QUERY_RESULT} from '@repo/sanity-queries'
import {stegaClean} from '@sanity/client/stega'
import {SanityImage} from '@/components/sanity-image'
import {createMetadata} from '@/lib/metadata'

export const metadata = createMetadata({
  title: 'Schedule',
  description:
    'Full conference schedule for Everything NYC 2026 — times, rooms, and tracks for every session.',
  path: '/schedule',
})

export default function SchedulePage() {
  return (
    <main id="main-content" className="mx-auto max-w-content-wide px-6 py-16 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Schedule</h1>
      <Suspense>
        <ScheduleDynamic />
      </Suspense>
    </main>
  )
}

async function ScheduleDynamic() {
  const opts = await getDynamicFetchOptions()
  return <ScheduleCached {...opts} />
}

async function ScheduleCached({perspective, stega}: DynamicFetchOptions) {
  'use cache'

  // First fetch conference to get the start date and ID
  const {data: conference} = await sanityFetch({
    query: CONFERENCE_QUERY,
    perspective,
    stega,
  })

  if (!conference?.startDate) {
    return <p className="mt-8 text-text-muted">Schedule not available yet.</p>
  }

  // Compute day boundaries for Day 1 in NYC timezone
  const startDate = new Date(conference.startDate)
  const dateStr = conference.startDate.slice(0, 10) // "2026-10-15"
  const dayStartStr = `${dateStr}T00:00:00-04:00`
  const dayEndStr = `${dateStr}T23:59:59-04:00`

  const {data: slots} = await sanityFetch({
    query: SCHEDULE_DAY_QUERY,
    params: {
      conferenceId: conference._id,
      dayStart: dayStartStr,
      dayEnd: dayEndStr,
    },
    perspective,
    stega,
  })

  if (!slots || slots.length === 0) {
    return <p className="mt-8 text-text-muted">No sessions scheduled yet.</p>
  }

  // Group slots by start time
  const timeGroups = new Map<string, SCHEDULE_DAY_QUERY_RESULT>()
  for (const slot of slots) {
    const time = slot.startTime
    if (!time) continue
    if (!timeGroups.has(time)) {
      timeGroups.set(time, [])
    }
    timeGroups.get(time)!.push(slot)
  }

  return (
    <section className="mt-8">
      <p className="mb-6 text-sm text-text-muted">
        {startDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'America/New_York',
        })}
      </p>
      <ol className="space-y-8" aria-label="Schedule by time">
        {Array.from(timeGroups.entries()).map(([time, groupSlots]) => (
          <li key={time}>
            <time dateTime={time} className="text-sm font-semibold text-text-primary">
              {new Date(time).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                timeZone: 'America/New_York',
              })}
            </time>
            <ul className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupSlots.map((slot) => (
                <SlotCard key={slot._id} slot={slot} />
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  )
}

function SlotCard({slot}: {slot: SCHEDULE_DAY_QUERY_RESULT[number]}) {
  const session = slot.session
  if (!session) return null

  const sessionType = stegaClean(session.sessionType)
  const isBreak = sessionType === 'break' || sessionType === 'social'

  return (
    <li
      className={`rounded-md p-4 ${
        isBreak
          ? 'bg-surface-muted text-text-muted'
          : 'border border-border transition-colors hover:border-border-strong'
      } ${slot.isPlenary ? 'sm:col-span-2 lg:col-span-3' : ''}`}
    >
      {isBreak ? (
        <p className="font-medium">{session.title}</p>
      ) : (
        <Link href={`/sessions/${session.slug}`} className="font-medium hover:underline">
          {session.title}
        </Link>
      )}

      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-text-muted">
        {session.sessionType && (
          <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium">
            {session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)}
          </span>
        )}
        {session.level}
        {session.track?.name && (
          <>
            {session.level && ' · '}
            <Link
              href={`/sessions?track=${session.track.slug}`}
              className="hover:text-text-primary hover:underline"
            >
              {session.track.name}
            </Link>
          </>
        )}
        {slot.room?.name && (
          <>
            {(session.level || session.track?.name) && ' · '}
            {slot.room.name}
          </>
        )}
      </p>

      {session.speakers && session.speakers.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-3">
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
    </li>
  )
}
