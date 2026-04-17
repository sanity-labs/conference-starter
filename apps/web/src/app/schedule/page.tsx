import {Suspense} from 'react'
import Link from 'next/link'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {CONFERENCE_QUERY, SCHEDULE_DAY_QUERY} from '@repo/sanity-queries'
import type {SCHEDULE_DAY_QUERY_RESULT} from '@repo/sanity-queries'
import {stegaClean} from '@sanity/client/stega'
import {SanityImage} from '@/components/sanity-image'
import {TrackBadge} from '@/components/track-badge'
import {ScheduleDayNav} from './schedule-day-nav'
import {createMetadata} from '@/lib/metadata'

export const metadata = createMetadata({
  title: 'Schedule',
  description:
    `Full conference schedule — times, rooms, and tracks for every session.`,
  path: '/schedule',
})

type Props = {searchParams: Promise<{day?: string}>}

export default async function SchedulePage({searchParams}: Props) {
  const {day} = await searchParams
  return (
    <main id="main-content" className="mx-auto max-w-content-max px-6 py-16 lg:px-8 sm:py-24">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Schedule</h1>
      <Suspense>
        <ScheduleDynamic selectedDay={day} />
      </Suspense>
    </main>
  )
}

async function ScheduleDynamic({selectedDay}: {selectedDay?: string}) {
  const opts = await getDynamicFetchOptions()
  return <ScheduleCached selectedDay={selectedDay} {...opts} />
}

async function ScheduleCached({selectedDay, perspective, stega}: {selectedDay?: string} & DynamicFetchOptions) {
  'use cache'

  const {data: conference} = await sanityFetch({
    query: CONFERENCE_QUERY,
    perspective,
    stega,
  })

  if (!conference?.startDate) {
    return <p className="mt-8 text-text-muted">Schedule not available yet.</p>
  }

  // Compute all conference days
  const days = computeConferenceDays(conference.startDate, conference.endDate)
  const activeDay = selectedDay && days.some((d) => d.date === selectedDay)
    ? selectedDay
    : days[0]?.date

  if (!activeDay) {
    return <p className="mt-8 text-text-muted">No schedule dates available.</p>
  }

  const dayStartStr = `${activeDay}T00:00:00-04:00`
  const dayEndStr = `${activeDay}T23:59:59-04:00`

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

  // Group slots by start time
  const timeGroups = new Map<string, SCHEDULE_DAY_QUERY_RESULT>()
  if (slots) {
    for (const slot of slots) {
      const time = slot.startTime
      if (!time) continue
      if (!timeGroups.has(time)) {
        timeGroups.set(time, [])
      }
      timeGroups.get(time)!.push(slot)
    }
  }

  return (
    <>
      <ScheduleDayNav days={days} />
      <section className="mt-8">
        {timeGroups.size === 0 ? (
          <p className="text-text-muted">No sessions scheduled for this day.</p>
        ) : (
          <ol className="space-y-6" aria-label="Schedule by time">
            {Array.from(timeGroups.entries()).map(([time, groupSlots]) => (
              <li key={time}>
                <div className="sticky top-0 z-10 -mx-6 bg-surface/90 px-6 py-2 backdrop-blur supports-[backdrop-filter]:bg-surface/80 sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                  <time dateTime={time} className="text-sm font-semibold tabular-nums text-text-primary">
                    {new Date(time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZone: 'America/New_York',
                    })}
                  </time>
                </div>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groupSlots.map((slot) => (
                    <SlotCard key={slot._id} slot={slot} />
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  )
}

function computeConferenceDays(startDate: string, endDate: string | null): Array<{date: string; label: string}> {
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : start
  const days: Array<{date: string; label: string}> = []

  const current = new Date(start)
  let dayNum = 1
  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10)
    const label = `Day ${dayNum} — ${current.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })}`
    days.push({date: dateStr, label})
    current.setDate(current.getDate() + 1)
    dayNum++
  }

  return days
}

function SlotCard({slot}: {slot: SCHEDULE_DAY_QUERY_RESULT[number]}) {
  const session = slot.session
  if (!session) return null

  const sessionType = stegaClean(session.sessionType)
  const isBreak = sessionType === 'break' || sessionType === 'social'

  return (
    <li
      className={`${
        isBreak
          ? 'rounded-lg bg-surface-muted p-4 text-text-on-muted'
          : 'card'
      } ${slot.isPlenary ? 'sm:col-span-2 lg:col-span-3' : ''}`}
    >
      {isBreak ? (
        <p className="font-medium">{session.title}</p>
      ) : (
        <Link href={`/sessions/${session.slug}`} className="font-medium hover:underline">
          {session.title}
        </Link>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-text-muted">
        {session.sessionType && (
          <span className="inline-flex items-center rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-medium">
            {session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)}
          </span>
        )}
        {session.track && (
          <TrackBadge name={session.track.name} slug={session.track.slug} color={session.track.color} />
        )}
        {session.level && <span>{session.level}</span>}
        {slot.room?.name && (
          <>
            {(session.level || session.track?.name) && ' · '}
            <Link
              href={`/venue#room-${slot.room.slug}`}
              className="hover:text-text-primary hover:underline"
            >
              {slot.room.name}
            </Link>
          </>
        )}
      </div>

      {session.speakers && session.speakers.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-3">
          {session.speakers.map((speaker) => (
            <li key={speaker._id} className="flex items-center gap-2 text-sm">
              {speaker.photo && (
                <SanityImage
                  value={speaker.photo}
                  className="size-6 rounded-full object-cover"
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
