import {Suspense, useState, startTransition, useMemo} from 'react'
import {SanityApp, useQuery} from '@sanity/sdk-react'
import {Flex, Spinner, Text, Card} from '@sanity/ui'
import {CONFERENCE_QUERY, SLOTS_QUERY, ROOMS_QUERY} from '../queries'
import type {ConferenceData, SlotData, RoomData} from '../types'
import {getConferenceDays, getDayBounds, generateTimeIntervals} from '../utils/timeGrid'
import {ConferenceHeader} from './ConferenceHeader'
import {ScheduleGrid} from './ScheduleGrid'

function ScheduleContent() {
  const {data: conference} = useQuery<ConferenceData>({query: CONFERENCE_QUERY})

  if (!conference) {
    return (
      <Card padding={4}>
        <Text muted>No conference found. Create a conference document first.</Text>
      </Card>
    )
  }

  if (!conference.startDate || !conference.endDate) {
    return (
      <Card padding={4}>
        <Text muted>Set start and end dates on the conference document.</Text>
      </Card>
    )
  }

  return (
    <ScheduleWithConference conference={conference as ConferenceData & {startDate: string; endDate: string}} />
  )
}

function ScheduleWithConference({
  conference,
}: {
  conference: ConferenceData & {startDate: string; endDate: string}
}) {
  const days = useMemo(
    () => getConferenceDays(conference.startDate, conference.endDate),
    [conference.startDate, conference.endDate],
  )
  const [selectedDay, setSelectedDay] = useState(days[0])
  const [isPending, setIsPending] = useState(false)

  const handleSelectDay = (day: string) => {
    setIsPending(true)
    startTransition(() => {
      setSelectedDay(day)
      setIsPending(false)
    })
  }

  const {dayStart, dayEnd} = useMemo(() => getDayBounds(selectedDay), [selectedDay])
  const intervals = useMemo(() => generateTimeIntervals(selectedDay), [selectedDay])

  return (
    <Flex direction="column" style={{height: '100%'}}>
      <ConferenceHeader
        conferenceName={conference.name}
        days={days}
        selectedDay={selectedDay}
        onSelectDay={handleSelectDay}
        isPending={isPending}
      />
      <Flex flex={1} style={{overflow: 'hidden', opacity: isPending ? 0.6 : 1, transition: 'opacity 150ms'}}>
        <Suspense
          fallback={
            <Flex padding={4} align="center" gap={3} flex={1}>
              <Spinner muted />
              <Text muted>Loading schedule...</Text>
            </Flex>
          }
        >
          <GridLoader
            conferenceId={conference._id}
            dayStart={dayStart}
            dayEnd={dayEnd}
            intervals={intervals}
          />
        </Suspense>
      </Flex>
    </Flex>
  )
}

function GridLoader({
  conferenceId,
  dayStart,
  dayEnd,
  intervals,
}: {
  conferenceId: string
  dayStart: string
  dayEnd: string
  intervals: ReturnType<typeof generateTimeIntervals>
}) {
  const {data: slots} = useQuery<SlotData[]>({
    query: SLOTS_QUERY,
    params: {conferenceId, dayStart, dayEnd},
  })
  const {data: rooms} = useQuery<RoomData[]>({query: ROOMS_QUERY})

  if (!rooms || rooms.length === 0) {
    return (
      <Card padding={4} flex={1}>
        <Text muted>No rooms found. Create room documents first.</Text>
      </Card>
    )
  }

  return (
    <ScheduleGrid
      slots={slots ?? []}
      rooms={rooms}
      intervals={intervals}
    />
  )
}

export function ScheduleBuilder() {
  return (
    <SanityApp
      fallback={
        <Flex padding={4} align="center" justify="center" style={{height: '100%'}}>
          <Spinner muted />
        </Flex>
      }
    >
      <Suspense
        fallback={
          <Flex padding={4} align="center" gap={3}>
            <Spinner muted />
            <Text muted>Loading conference...</Text>
          </Flex>
        }
      >
        <ScheduleContent />
      </Suspense>
    </SanityApp>
  )
}
