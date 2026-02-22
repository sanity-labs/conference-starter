import {Suspense, useState, startTransition, useMemo, useCallback} from 'react'
import {
  SanityApp,
  SDKStudioContext,
  useQuery,
  useApplyDocumentActions,
  createDocumentHandle,
  createDocument,
  publishDocument,
  deleteDocument,
} from '@sanity/sdk-react'
import type {StudioWorkspaceHandle} from '@sanity/sdk-react'
import {useWorkspace} from 'sanity'
import {Flex, Spinner, Text, Card, useToast} from '@sanity/ui'
import {CONFERENCE_QUERY, SLOTS_QUERY, ROOMS_QUERY} from '../queries'
import type {ConferenceData, SlotData, RoomData, SessionData} from '../types'
import {getConferenceDays, getDayBounds, generateTimeIntervals} from '../utils/timeGrid'
import {ConferenceHeader} from './ConferenceHeader'
import {ScheduleGrid} from './ScheduleGrid'
import {UnscheduledPanel} from './UnscheduledPanel'
import {AssignmentDialog} from './AssignmentDialog'
import type {AssignTarget} from './AssignmentDialog'

/**
 * Bridge: sanity@5.11 doesn't provide SDKStudioContext yet.
 * This wrapper passes the Studio workspace to the SDK so SanityApp
 * picks up projectId, dataset, and auth automatically.
 * Remove once Studio ships native SDKStudioContext support.
 */
function SDKBridge({children}: {children: React.ReactNode}) {
  const workspace = useWorkspace()
  return (
    <SDKStudioContext.Provider value={workspace as unknown as StudioWorkspaceHandle}>
      {children}
    </SDKStudioContext.Provider>
  )
}

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
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null)
  const [editingSlot, setEditingSlot] = useState<SlotData | null>(null)
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null)

  const handleSelectDay = (day: string) => {
    setIsPending(true)
    startTransition(() => {
      setSelectedDay(day)
      setIsPending(false)
    })
  }

  const handleSelectSession = useCallback((session: SessionData | null) => {
    setSelectedSession(session)
  }, [])

  const handleSlotClick = useCallback((slot: SlotData) => {
    setEditingSlot(slot)
  }, [])

  const handleCellClick = useCallback(
    (roomId: string, time: string) => {
      if (selectedSession) {
        setAssignTarget({roomId, time})
      }
    },
    [selectedSession],
  )

  const handleCloseDialog = useCallback(() => {
    setEditingSlot(null)
    setAssignTarget(null)
  }, [])

  const handleAssigned = useCallback(() => {
    setEditingSlot(null)
    setAssignTarget(null)
    setSelectedSession(null)
  }, [])

  const {dayStart, dayEnd} = useMemo(() => getDayBounds(selectedDay), [selectedDay])
  const intervals = useMemo(() => generateTimeIntervals(selectedDay), [selectedDay])

  const showDialog = editingSlot || (assignTarget && selectedSession)

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
            selectedSessionId={selectedSession?._id ?? null}
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
          <GridWithActions
            conferenceId={conference._id}
            dayStart={dayStart}
            dayEnd={dayEnd}
            intervals={intervals}
            selectedSession={selectedSession}
            editingSlot={editingSlot}
            assignTarget={assignTarget}
            showDialog={!!showDialog}
            onSlotClick={handleSlotClick}
            onCellClick={handleCellClick}
            onCloseDialog={handleCloseDialog}
            onAssigned={handleAssigned}
          />
        </Suspense>
      </Flex>
    </Flex>
  )
}

function GridWithActions({
  conferenceId,
  dayStart,
  dayEnd,
  intervals,
  selectedSession,
  editingSlot,
  assignTarget,
  showDialog,
  onSlotClick,
  onCellClick,
  onCloseDialog,
  onAssigned,
}: {
  conferenceId: string
  dayStart: string
  dayEnd: string
  intervals: ReturnType<typeof generateTimeIntervals>
  selectedSession: SessionData | null
  editingSlot: SlotData | null
  assignTarget: AssignTarget | null
  showDialog: boolean
  onSlotClick: (slot: SlotData) => void
  onCellClick: (roomId: string, time: string) => void
  onCloseDialog: () => void
  onAssigned: () => void
}) {
  const {data: slots} = useQuery<SlotData[]>({
    query: SLOTS_QUERY,
    params: {conferenceId, dayStart, dayEnd},
  })
  const {data: rooms} = useQuery<RoomData[]>({query: ROOMS_QUERY})
  const apply = useApplyDocumentActions()
  const toast = useToast()

  const handleAssign = useCallback(
    async (data: {
      sessionId: string
      roomId: string
      startTime: string
      endTime: string
      isPlenary: boolean
    }) => {
      const handle = createDocumentHandle({
        documentId: crypto.randomUUID(),
        documentType: 'scheduleSlot',
      })

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK generic types don't know our schema fields
        const initialValue: any = {
          session: {_type: 'reference', _ref: data.sessionId},
          conference: {_type: 'reference', _ref: conferenceId},
          room: {_type: 'reference', _ref: data.roomId},
          startTime: data.startTime,
          endTime: data.endTime,
          isPlenary: data.isPlenary,
        }
        await apply([createDocument(handle, initialValue), publishDocument(handle)])
        toast.push({status: 'success', title: 'Session assigned'})
        onAssigned()
      } catch (err) {
        toast.push({status: 'error', title: 'Failed to assign session'})
      }
    },
    [apply, conferenceId, toast, onAssigned],
  )

  const handleUpdate = useCallback(
    async (data: {
      slotId: string
      roomId: string
      startTime: string
      endTime: string
      isPlenary: boolean
    }) => {
      const handle = createDocumentHandle({
        documentId: data.slotId,
        documentType: 'scheduleSlot',
      })

      try {
        // Delete and recreate to update all fields atomically
        await apply([deleteDocument(handle)])
        const newHandle = createDocumentHandle({
          documentId: data.slotId,
          documentType: 'scheduleSlot',
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK generic types don't know our schema fields
        const initialValue: any = {
          session: {_type: 'reference', _ref: editingSlot?.session?._id ?? ''},
          conference: {_type: 'reference', _ref: conferenceId},
          room: {_type: 'reference', _ref: data.roomId},
          startTime: data.startTime,
          endTime: data.endTime,
          isPlenary: data.isPlenary,
        }
        await apply([createDocument(newHandle, initialValue), publishDocument(newHandle)])
        toast.push({status: 'success', title: 'Slot updated'})
        onAssigned()
      } catch (err) {
        toast.push({status: 'error', title: 'Failed to update slot'})
      }
    },
    [apply, conferenceId, editingSlot, toast, onAssigned],
  )

  const handleRemove = useCallback(
    async (slotId: string) => {
      const handle = createDocumentHandle({
        documentId: slotId,
        documentType: 'scheduleSlot',
      })

      try {
        await apply([deleteDocument(handle)])
        toast.push({status: 'success', title: 'Slot removed'})
        onAssigned()
      } catch (err) {
        toast.push({status: 'error', title: 'Failed to remove slot'})
      }
    },
    [apply, toast, onAssigned],
  )

  if (!rooms || rooms.length === 0) {
    return (
      <Card padding={4} flex={1}>
        <Text muted>No rooms found. Create room documents first.</Text>
      </Card>
    )
  }

  const dialogMode = editingSlot ? 'edit' : 'create'

  return (
    <>
      <ScheduleGrid
        slots={slots ?? []}
        rooms={rooms}
        intervals={intervals}
        onSlotClick={onSlotClick}
        onCellClick={selectedSession ? onCellClick : undefined}
      />
      {showDialog && (
        <AssignmentDialog
          mode={dialogMode as 'create' | 'edit'}
          session={selectedSession}
          slot={editingSlot}
          target={assignTarget}
          rooms={rooms}
          intervals={intervals}
          allSlots={slots ?? []}
          conferenceId={conferenceId}
          onAssign={handleAssign}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          onClose={onCloseDialog}
        />
      )}
    </>
  )
}

export function ScheduleBuilder() {
  return (
    <SDKBridge>
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
    </SDKBridge>
  )
}
