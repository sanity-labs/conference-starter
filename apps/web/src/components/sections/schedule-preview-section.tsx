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
    <section className="mx-auto max-w-content px-6 py-12">
      {heading && <h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>}
      <ul className="mt-4 divide-y divide-border">
        {displayed.map((slot) => (
          <li key={slot._id} className="flex gap-4 py-3">
            {slot.startTime && (
              <time dateTime={slot.startTime} className="w-20 shrink-0 text-sm font-medium text-text-muted">
                {new Date(slot.startTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: 'America/New_York',
                })}
              </time>
            )}
            <div className="min-w-0">
              {slot.session && (
                <>
                  <Link href={`/sessions/${slot.session.slug}`} className="font-medium hover:underline">
                    {slot.session.title}
                  </Link>
                  {slot.session.speakers && slot.session.speakers.length > 0 && (
                    <p className="text-sm text-text-muted">
                      {slot.session.speakers.map((s) => s.name).join(', ')}
                    </p>
                  )}
                </>
              )}
              {slot.room && <span className="text-xs text-text-muted"> {slot.room.name}</span>}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4">
        <Link href="/schedule" className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
          View full schedule &rarr;
        </Link>
      </p>
    </section>
  )
}
