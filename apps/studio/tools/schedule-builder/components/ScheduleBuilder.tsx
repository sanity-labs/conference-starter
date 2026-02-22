import {Suspense, useState, startTransition, useMemo, useCallback} from 'react'
import {SanityApp, useQuery} from '@sanity/sdk-react'
import {Flex, Spinner, Text, Card} from '@sanity/ui'
import {CONFERENCE_QUERY, SLOTS_QUERY, ROOMS_QUERY} from '../queries'
import type {ConferenceData, SlotData, RoomData, SessionData} from '../types'
import {getConferenceDays, getDayBounds, generateTimeIntervals} from '../utils/timeGrid'
import {ConferenceHeader} from './ConferenceHeader'
import {ScheduleGrid} from './ScheduleGrid'
import {UnscheduledPanel} from './UnscheduledPanel'

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
    <ScheduleWithConference
      conference={conference as ConferenceData & {startDate: string; endDate: string}}
    />
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
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [editingSlot, setEditingSlot] = useState<SlotData | null>(null)
  const [assignTarget, setAssignTarget] = useState<{roomId: string; time: string} | null>(null)

  const handleSelectDay = (day: string) => {
    setIsPending(true)
    startTransition(() => {
      setSelectedDay(day)
      setIsPending(false)
    })
  }

  const handleSelectSession = useCallback((session: SessionData | null) => {
    setSelectedSessionId(session?._id ?? null)
  }, [])

  const handleSlotClick = useCallback((slot: SlotData) => {
    setEditingSlot(slot)
  }, [])

  const handleCellClick = useCallback(
    (roomId: string, time: string) => {
      if (selectedSessionId) {
        setAssignTarget({roomId, time})
      }
    },
    [selectedSessionId],
  )

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
      <Flex
        flex={1}
        style={{
          overflow: 'hidden',
          opacity: isPending ? 0.6 : 1,
          transition: 'opacity 150ms',
        }}
      >
        <Suspense
          fallback={
            <Card padding={4} style={{width: 300, minWidth: 300}}>
              <Flex align="center" gap={3}>
                <Spinner muted />
                <Text muted>Loading sessions...</Text>
              </Flex>
            </Card>
          }
        >
          <UnscheduledPanel
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
          />
        </Suspense>
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
            selectedSessionId={selectedSessionId}
            onSlotClick={handleSlotClick}
            onCellClick={handleCellClick}
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
  selectedSessionId,
  onSlotClick,
  onCellClick,
}: {
  conferenceId: string
  dayStart: string
  dayEnd: string
  intervals: ReturnType<typeof generateTimeIntervals>
  selectedSessionId: string | null
  onSlotClick: (slot: SlotData) => void
  onCellClick: (roomId: string, time: string) => void
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
      onSlotClick={onSlotClick}
      onCellClick={selectedSessionId ? onCellClick : undefined}
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
