import {sanityFetch} from '@/sanity/live'
import {CONFERENCE_QUERY, ROOM_DAY_SLOTS_QUERY} from '@repo/sanity-queries'
import type {SIGNAGE_DISPLAY_QUERY_RESULT, ROOM_DAY_SLOTS_QUERY_RESULT} from '@repo/sanity-queries'
import {Stage} from './stage'
import {NowNextClient} from './now-next-client'
import {resolveConferenceDay} from './conference-day'

type Display = NonNullable<SIGNAGE_DISPLAY_QUERY_RESULT>

export async function NowNext({display, hideChrome}: {display: Display; hideChrome: boolean}) {
  if (!display.room?._id) {
    return (
      <Stage hideChrome={hideChrome} eyebrow="Configuration needed">
        <div style={{textAlign: 'center'}}>
          <p className="signage-eyebrow">Pick a room</p>
          <p className="signage-meta">
            now-next displays need a room reference. Set one in Studio.
          </p>
        </div>
      </Stage>
    )
  }

  const {data: conference} = await sanityFetch({
    query: CONFERENCE_QUERY,
    perspective: 'published',
    stega: false,
  })

  const day = resolveConferenceDay({
    startDate: conference?.startDate,
    endDate: conference?.endDate,
  })

  const {data: slotsData} = await sanityFetch({
    query: ROOM_DAY_SLOTS_QUERY,
    params: {
      roomId: display.room._id,
      dayStart: day.dayStart,
      dayEnd: day.dayEnd,
    },
    perspective: 'published',
    stega: false,
  })

  const slots = (slotsData ?? []) as ROOM_DAY_SLOTS_QUERY_RESULT

  return (
    <Stage
      conferenceName={conference?.name}
      conferenceTagline={display.room.name}
      showClock={display.showClock !== false}
      showConferenceBranding={display.showConferenceBranding !== false}
      hideChrome={hideChrome}
      footnote={day.date}
    >
      <NowNextClient
        slots={slots}
        roomName={display.room.name ?? ''}
        dayStart={day.dayStart}
        dayEnd={day.dayEnd}
      />
    </Stage>
  )
}
