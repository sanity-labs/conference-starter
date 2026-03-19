import {Suspense} from 'react'
import Link from 'next/link'
import type {Metadata} from 'next'
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {CONFERENCE_QUERY, SCHEDULE_DAY_QUERY} from '@repo/sanity-queries'
import type {SCHEDULE_DAY_QUERY_RESULT} from '@repo/sanity-queries'
import {stegaClean} from '@sanity/client/stega'
import {SanityImage} from '@/components/sanity-image'

export const metadata: Metadata = {
  title: 'Schedule',
  description: 'Full conference schedule for Everything NYC 2026.',
}

export default function SchedulePage() {
  return (
    <main id="main-content" className="mx-auto max-w-content px-6 py-16 sm:py-24">
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
    return <p className="mt-8 text-gray-500">Schedule not available yet.</p>
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
    return <p className="mt-8 text-gray-500">No sessions scheduled yet.</p>
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
      <p className="mb-6 text-sm text-gray-500">
        {startDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'America/New_York',
        })}
      </p>
      <ol className="space-y-8">
        {Array.from(timeGroups.entries()).map(([time, groupSlots]) => (
          <li key={time}>
            <time dateTime={time} className="text-sm font-medium text-gray-500">
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
    <li className={`border-l-2 pl-4 ${slot.isPlenary ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
      {isBreak ? (
        <p className="font-medium text-gray-500">{session.title}</p>
      ) : (
        <Link href={`/sessions/${session.slug}`} className="font-medium underline">
          {session.title}
        </Link>
      )}

      <p className="text-sm text-gray-600">
        {[
          session.sessionType &&
            session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1),
          session.level,
          session.track?.name,
          slot.room?.name,
        ]
          .filter(Boolean)
          .join(' · ')}
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
                />
              )}
              <Link href={`/speakers/${speaker.slug}`} className="underline">
                {speaker.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
