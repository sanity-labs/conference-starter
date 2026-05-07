import {sanityFetch} from '@/sanity/live'
import {CONFERENCE_QUERY, MULTI_ROOM_DAY_SLOTS_QUERY} from '@repo/sanity-queries'
import type {
  SIGNAGE_DISPLAY_QUERY_RESULT,
  MULTI_ROOM_DAY_SLOTS_QUERY_RESULT,
} from '@repo/sanity-queries'
import {Stage} from './stage'
import {HallwayCarouselClient} from './hallway-carousel-client'
import {resolveConferenceDay} from './conference-day'

type Display = NonNullable<SIGNAGE_DISPLAY_QUERY_RESULT>

export async function HallwayCarousel({
  display,
  hideChrome,
}: {
  display: Display
  hideChrome: boolean
}) {
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

  const roomIds = (display.rooms ?? [])
    .map((room) => room?._id)
    .filter((id): id is string => Boolean(id))

  const {data} = await sanityFetch({
    query: MULTI_ROOM_DAY_SLOTS_QUERY,
    params: {
      roomIds,
      dayStart: day.dayStart,
      dayEnd: day.dayEnd,
    },
    perspective: 'published',
    stega: false,
  })

  const slots = (data ?? []) as MULTI_ROOM_DAY_SLOTS_QUERY_RESULT

  return (
    <Stage
      conferenceName={conference.name}
      conferenceTagline="Across the venue"
      showClock={display.showClock !== false}
      showConferenceBranding={display.showConferenceBranding !== false}
      hideChrome={hideChrome}
    >
      <HallwayCarouselClient
        slots={slots}
        lookaheadMinutes={display.lookaheadMinutes ?? 30}
        dwellSeconds={display.dwellSeconds ?? 8}
        transition={(display.transition as 'fade' | 'slide' | 'none') ?? 'fade'}
      />
    </Stage>
  )
}
