import Link from 'next/link'
import {sanityFetch} from '@/sanity/live'
import type {DynamicFetchOptions} from '@/sanity/live'
import {CONFERENCE_QUERY, SCHEDULE_DAY_QUERY} from '@repo/sanity-queries'

interface SchedulePreviewSectionProps {
  heading: string | null
  day: string | null
  maxSlots: number | null
  perspective: DynamicFetchOptions['perspective']
  stega: DynamicFetchOptions['stega']
}

export async function SchedulePreviewSection({
  heading,
  day,
  maxSlots,
  perspective,
  stega,
}: SchedulePreviewSectionProps) {
  const {data: conference} = await sanityFetch({
    query: CONFERENCE_QUERY,
    perspective,
    stega,
  })
  if (!conference) return null

  const targetDay = day || (conference.startDate ? conference.startDate.split('T')[0] : null)
  if (!targetDay) return null

  const dayStart = `${targetDay}T00:00:00Z`
  const dayEnd = `${targetDay}T23:59:59Z`

  const {data: slots} = await sanityFetch({
    query: SCHEDULE_DAY_QUERY,
    params: {conferenceId: conference._id, dayStart, dayEnd},
    perspective,
    stega,
  })

  if (!slots || slots.length === 0) return null

  const displayed = maxSlots ? slots.slice(0, maxSlots) : slots

  return (
    <section>
      {heading && <h2>{heading}</h2>}
      <ul>
        {displayed.map((slot) => (
          <li key={slot._id}>
            {slot.startTime && (
              <time dateTime={slot.startTime}>
                {new Date(slot.startTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: 'America/New_York',
                })}
              </time>
            )}
            {slot.session && (
              <>
                {' '}
                <Link href={`/sessions/${slot.session.slug}`}>{slot.session.title}</Link>
                {slot.session.speakers && slot.session.speakers.length > 0 && (
                  <span>
                    {' — '}
                    {slot.session.speakers.map((s) => s.name).join(', ')}
                  </span>
                )}
              </>
            )}
            {slot.room && <span> ({slot.room.name})</span>}
          </li>
        ))}
      </ul>
      <p>
        <Link href="/schedule">View full schedule</Link>
      </p>
    </section>
  )
}
