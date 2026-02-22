import {Suspense, useState, startTransition, useMemo, useCallback, useRef} from 'react'
import {
  SanityApp,
  useQuery,
  useApplyDocumentActions,
  createDocumentHandle,
  createDocument,
  publishDocument,
  deleteDocument,
} from '@sanity/sdk-react'
import {useWorkspace} from 'sanity'
import {Flex, Spinner, Text, Card, Button, useToast} from '@sanity/ui'
import {CloseIcon} from '@sanity/icons'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type {DragStartEvent, DragEndEvent, Active} from '@dnd-kit/core'
import {CONFERENCE_QUERY, SLOTS_QUERY, ROOMS_QUERY} from '../queries'
import type {ConferenceData, SlotData, RoomData, SessionData} from '../types'
import {
  getConferenceDays,
  getDayBounds,
  generateTimeIntervals,
  computeTimeRange,
} from '../utils/timeGrid'
import {ConferenceHeader} from './ConferenceHeader'
import {ScheduleGrid} from './ScheduleGrid'
import {UnscheduledPanel} from './UnscheduledPanel'
import {AssignmentDialog} from './AssignmentDialog'
import {DragOverlayContent} from './DragOverlayContent'
import type {AssignTarget} from './AssignmentDialog'

/** Callback exposed by GridWithActions for direct slot moves (no dialog) */
export type DirectMoveFn = (
  slotId: string,
  roomId: string,
  time: string,
  duration: number,
  isPlenary: boolean,
) => Promise<void>

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
  const [activeDrag, setActiveDrag] = useState<Active | null>(null)

  // Ref for direct slot moves — GridWithActions sets this so the drag handler can call it
  const directMoveRef = useRef<DirectMoveFn | null>(null)

  // Sensors: pointer with 5px distance activation (so clicks still work), + keyboard
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {distance: 5},
  })
  const keyboardSensor = useSensor(KeyboardSensor)
  const sensors = useSensors(pointerSensor, keyboardSensor)

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

  const handleCancelSelection = useCallback(() => {
    setSelectedSession(null)
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDrag(event.active)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null)

      const {active, over} = event
      if (!over?.data?.current) return

      const overData = over.data.current as {roomId: string; time: string}
      if (!overData.roomId || !overData.time) return

      const activeData = active.data.current as
        | {type: 'session'; session: SessionData}
        | {type: 'slot'; slot: SlotData}

      if (activeData.type === 'session') {
        // Dragged from sidebar: select session + set target → opens dialog
        setSelectedSession(activeData.session)
        setAssignTarget({roomId: overData.roomId, time: overData.time})
      } else if (activeData.type === 'slot') {
        // Dragged existing slot: move directly without dialog
        const slot = activeData.slot
        const duration = slot.session?.duration ?? 30
        const isPlenary = slot.isPlenary ?? false
        if (directMoveRef.current) {
          directMoveRef.current(slot._id, overData.roomId, overData.time, duration, isPlenary)
        }
      }
    },
    [],
  )

  const {dayStart, dayEnd} = useMemo(() => getDayBounds(selectedDay), [selectedDay])

  const showDialog = editingSlot || (assignTarget && selectedSession)

  // Determine the session to show in the drag overlay
  const dragSession = useMemo(() => {
    if (!activeDrag?.data?.current) return null
    const data = activeDrag.data.current as
      | {type: 'session'; session: SessionData}
      | {type: 'slot'; slot: SlotData}
    if (data.type === 'session') return data.session
    if (data.type === 'slot') return data.slot.session
    return null
  }, [activeDrag])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Flex direction="column" style={{height: '100%'}}>
        <ConferenceHeader
          conferenceName={conference.name}
          days={days}
          selectedDay={selectedDay}
          onSelectDay={handleSelectDay}
          isPending={isPending}
        />
        {/* Selection banner: shown when a session is selected for placement */}
        {selectedSession && !activeDrag && (
          <Card padding={2} paddingX={3} tone="primary" borderBottom>
            <Flex align="center" gap={3}>
              <Text size={1}>
                Click a cell to place: <strong>{selectedSession.title}</strong>
              </Text>
              <Button
                mode="bleed"
                tone="primary"
                icon={CloseIcon}
                fontSize={1}
                padding={1}
                text="Cancel"
                onClick={handleCancelSelection}
              />
            </Flex>
          </Card>
        )}
        <Flex
          flex={1}
          style={{
            overflow: 'hidden',
            minHeight: 0,
            opacity: isPending ? 0.6 : 1,
            transition: 'opacity 150ms',
          }}
        >
          <Suspense
            fallback={
              <Card padding={4} style={{width: 280, minWidth: 200, maxWidth: 320}}>
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
              selectedDay={selectedDay}
              dayStart={dayStart}
              dayEnd={dayEnd}
              selectedSession={selectedSession}
              editingSlot={editingSlot}
              assignTarget={assignTarget}
              showDialog={!!showDialog}
              directMoveRef={directMoveRef}
              onSlotClick={handleSlotClick}
              onCellClick={handleCellClick}
              onCloseDialog={handleCloseDialog}
              onAssigned={handleAssigned}
            />
          </Suspense>
        </Flex>
      </Flex>
      <DragOverlay dropAnimation={null}>
        {dragSession ? <DragOverlayContent session={dragSession} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function GridWithActions({
  conferenceId,
  selectedDay,
  dayStart,
  dayEnd,
  selectedSession,
  editingSlot,
  assignTarget,
  showDialog,
  directMoveRef,
  onSlotClick,
  onCellClick,
  onCloseDialog,
  onAssigned,
}: {
  conferenceId: string
  selectedDay: string
  dayStart: string
  dayEnd: string
  selectedSession: SessionData | null
  editingSlot: SlotData | null
  assignTarget: AssignTarget | null
  showDialog: boolean
  directMoveRef: React.MutableRefObject<DirectMoveFn | null>
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

  // Auto-fit time range based on actual slot data
  const {startHour, endHour} = useMemo(() => computeTimeRange(slots ?? []), [slots])
  const intervals = useMemo(
    () => generateTimeIntervals(selectedDay, startHour, endHour),
    [selectedDay, startHour, endHour],
  )

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

  // Direct move: used by DnD drag-end for existing slots (no dialog)
  const handleDirectMove = useCallback(
    async (slotId: string, roomId: string, time: string, duration: number, isPlenary: boolean) => {
      const startTime = time
      const endTime = new Date(new Date(time).getTime() + duration * 60 * 1000).toISOString()

      // Find the slot to get the session reference
      const slot = (slots ?? []).find((s) => s._id === slotId)
      const sessionId = slot?.session?._id
      if (!sessionId) return

      const handle = createDocumentHandle({
        documentId: slotId,
        documentType: 'scheduleSlot',
      })

      try {
        await apply([deleteDocument(handle)])
        const newHandle = createDocumentHandle({
          documentId: slotId,
          documentType: 'scheduleSlot',
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK generic types don't know our schema fields
        const initialValue: any = {
          session: {_type: 'reference', _ref: sessionId},
          conference: {_type: 'reference', _ref: conferenceId},
          room: {_type: 'reference', _ref: roomId},
          startTime,
          endTime,
          isPlenary,
        }
        await apply([createDocument(newHandle, initialValue), publishDocument(newHandle)])
        toast.push({status: 'success', title: 'Slot moved'})
      } catch (err) {
        toast.push({status: 'error', title: 'Failed to move slot'})
      }
    },
    [apply, conferenceId, slots, toast],
  )

  // Expose direct move to parent's drag handler via ref
  directMoveRef.current = handleDirectMove

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
        hasSelectedSession={!!selectedSession}
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

/**
 * Bridge: sanity@5.11 doesn't provide SDKStudioContext natively yet (tracked
 * in Studio PR #12157). Using SDKStudioContext.Provider + useWorkspace()
 * fails because workspace.auth.token is an RxJS Observable that emits null
 * under cookie auth — the SDK subscribes and sets LOGGED_OUT.
 *
 * Workaround: pass explicit config with `studio: {}` (empty). This tells the
 * SDK "we're inside a Studio" WITHOUT providing a TokenSource, so it falls
 * back to cookie auth via withCredentials — which works because Studio's
 * cookies are already set.
 *
 * Remove once Studio ships native SDKStudioContext support.
 */
export function ScheduleBuilder() {
  const workspace = useWorkspace()
  const config = useMemo(
    () => ({
      projectId: workspace.projectId,
      dataset: workspace.dataset,
      studio: {},
    }),
    [workspace.projectId, workspace.dataset],
  )
  return (
    <SanityApp
      config={config}
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
