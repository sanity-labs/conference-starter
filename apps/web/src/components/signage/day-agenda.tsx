import {sanityFetch} from '@/sanity/live'
import {CONFERENCE_QUERY, SCHEDULE_DAY_QUERY} from '@repo/sanity-queries'
import type {SIGNAGE_DISPLAY_QUERY_RESULT, SCHEDULE_DAY_QUERY_RESULT} from '@repo/sanity-queries'
import {Stage} from './stage'
import {DayAgendaClient} from './day-agenda-client'
import {resolveConferenceDay} from './conference-day'

type Display = NonNullable<SIGNAGE_DISPLAY_QUERY_RESULT>

export async function DayAgenda({display, hideChrome}: {display: Display; hideChrome: boolean}) {
  const {data: conference} = await sanityFetch({
    query: CONFERENCE_QUERY,
    perspective: 'published',
    stega: false,
  })

  if (!conference?._id) {
    return (
      <Stage hideChrome={hideChrome}>
        <p className="signage-meta">No conference configured.</p>
      </Stage>
    )
  }

  const day = resolveConferenceDay({
    startDate: conference.startDate,
    endDate: conference.endDate,
  })

  const {data} = await sanityFetch({
    query: SCHEDULE_DAY_QUERY,
    params: {
      conferenceId: conference._id,
      dayStart: day.dayStart,
      dayEnd: day.dayEnd,
    },
    perspective: 'published',
    stega: false,
  })

  const slots = (data ?? []) as SCHEDULE_DAY_QUERY_RESULT

  return (
    <Stage
      conferenceName={conference.name}
      conferenceTagline={conference.tagline}
      showClock={display.showClock !== false}
      showConferenceBranding={display.showConferenceBranding !== false}
      hideChrome={hideChrome}
      footnote={`Today's schedule · ${day.date}`}
    >
      <DayAgendaClient slots={slots} />
    </Stage>
  )
}
