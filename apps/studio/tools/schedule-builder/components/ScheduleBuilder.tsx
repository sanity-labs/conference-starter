import {Suspense, useState, startTransition, useMemo, useCallback, useRef, useEffect} from 'react'
import {
  SanityApp,
  useQuery,
  useApplyDocumentActions,
  createDocumentHandle,
  createDocument,
  editDocument,
  publishDocument,
  deleteDocument,
} from '@sanity/sdk-react'
import {useWorkspace} from 'sanity'
import {Flex, Spinner, Text, Card, Button, useToast} from '@sanity/ui'
import {CloseIcon} from '@sanity/icons'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDndMonitor,
  pointerWithin,
  MeasuringStrategy,
} from '@dnd-kit/core'
import type {DragStartEvent, DragEndEvent, DragMoveEvent, Active, Over} from '@dnd-kit/core'
import {CONFERENCE_QUERY, SLOTS_QUERY, ROOMS_QUERY} from '../queries'
import type {ConferenceData, SlotData, RoomData, SessionData} from '../types'
import {
  getConferenceDays,
  getDayBounds,
  generateTimeIntervals,
  computeTimeRange,
  todayInTimezone,
  ROW_HEIGHT_PX,
  INTERVAL_MINUTES,
} from '../utils/timeGrid'
import {wouldConflict} from '../utils/conflicts'
import {usePendingOps} from '../hooks/usePendingOps'
import {useIsNarrow} from '../hooks/useIsNarrow'
import {ConferenceHeader} from './ConferenceHeader'
import {ScheduleGrid} from './ScheduleGrid'
import type {GhostTarget} from './ScheduleGrid'
import {UnscheduledPanel} from './UnscheduledPanel'
import {RoomPicker} from './RoomPicker'
import {SlotEditDialog} from './SlotEditDialog'
import {DragOverlayContent} from './DragOverlayContent'
import {TrackLegend} from './TrackLegend'
import {UndoBar} from './UndoBar'
import type {UndoEntry} from './UndoBar'

type DragData = {type: 'session'; session: SessionData} | {type: 'slot'; slot: SlotData}

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString()
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
  const [activeDrag, setActiveDrag] = useState<Active | null>(null)
  const isNarrow = useIsNarrow()

  // Sensors: mouse drags start after 5px (clicks still work); touch drags
  // start after a 250ms hold so one-finger scrolling isn't hijacked
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {distance: 5},
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {delay: 250, tolerance: 8},
  })
  const keyboardSensor = useSensor(KeyboardSensor)
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor)

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

  const handleCancelSelection = useCallback(() => {
    setSelectedSession(null)
  }, [])

  const handlePlaced = useCallback(() => {
    setSelectedSession(null)
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDrag(event.active)
  }, [])

  const handleDragFinish = useCallback(() => {
    setActiveDrag(null)
  }, [])

  const {dayStart, dayEnd} = useMemo(() => getDayBounds(selectedDay), [selectedDay])

  // Session shown in the drag overlay
  const dragSession = useMemo(() => {
    if (!activeDrag?.data?.current) return null
    const data = activeDrag.data.current as DragData
    if (data.type === 'session') return data.session
    if (data.type === 'slot') return data.slot.session
    return null
  }, [activeDrag])

  const isSlotDragging = (activeDrag?.data?.current as DragData | undefined)?.type === 'slot'

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      measuring={{droppable: {strategy: MeasuringStrategy.Always}}}
      onDragStart={handleDragStart}
      onDragEnd={handleDragFinish}
      onDragCancel={handleDragFinish}
    >
      <Flex direction="column" height="fill">
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
                Click the grid to place: <strong>{selectedSession.title}</strong>
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
          overflow="hidden"
          style={{
            position: 'relative',
            minHeight: 0,
            opacity: isPending ? 0.6 : 1,
            transition: 'opacity 150ms',
          }}
        >
          <Suspense
            fallback={
              <Flex padding={4} align="center" justify="center" gap={3} flex={1}>
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
              isSlotDragging={isSlotDragging}
              isNarrow={isNarrow}
              onSelectSession={handleSelectSession}
              onPlaced={handlePlaced}
            />
          </Suspense>
        </Flex>
      </Flex>
      <DragOverlay>
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
  isSlotDragging,
  isNarrow,
  onSelectSession,
  onPlaced,
}: {
  conferenceId: string
  selectedDay: string
  dayStart: string
  dayEnd: string
  selectedSession: SessionData | null
  isSlotDragging: boolean
  isNarrow: boolean
  onSelectSession: (session: SessionData | null) => void
  onPlaced: () => void
}) {
  const {data: serverSlots} = useQuery<SlotData[]>({
    query: SLOTS_QUERY,
    params: {conferenceId, dayStart, dayEnd},
  })
  const {data: rooms} = useQuery<RoomData[]>({query: ROOMS_QUERY})
  const apply = useApplyDocumentActions()
  const toast = useToast()

  const {slots, addOp, removeOp, pendingSessionIds} = usePendingOps(serverSlots ?? undefined)

  const [editingSlot, setEditingSlot] = useState<SlotData | null>(null)
  const [ghost, setGhost] = useState<GhostTarget | null>(null)
  const [undo, setUndo] = useState<UndoEntry | null>(null)

  // Narrow screens show one room at a time (calendar-style day view)
  const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null)
  const visibleRooms = useMemo(() => {
    if (!rooms || rooms.length === 0) return []
    if (!isNarrow) return rooms
    return [rooms.find((r) => r._id === focusedRoomId) ?? rooms[0]]
  }, [rooms, isNarrow, focusedRoomId])

  // Auto-fit time range; only ever widens while viewing the same day so the
  // grid doesn't jump around during mutations
  const computed = computeTimeRange(slots)
  const rangeRef = useRef<{day: string; startHour: number; endHour: number} | null>(null)
  if (!rangeRef.current || rangeRef.current.day !== selectedDay) {
    rangeRef.current = {day: selectedDay, ...computed}
  } else {
    rangeRef.current.startHour = Math.min(rangeRef.current.startHour, computed.startHour)
    rangeRef.current.endHour = Math.max(rangeRef.current.endHour, computed.endHour)
  }
  const {startHour, endHour} = rangeRef.current

  const intervals = useMemo(
    () => generateTimeIntervals(selectedDay, startHour, endHour),
    [selectedDay, startHour, endHour],
  )

  // ---- Mutations -----------------------------------------------------------
  // Every mutation: (1) registers a pending op so the UI updates instantly,
  // (2) runs a SINGLE atomic transaction, (3) on failure removes its own op
  // and reports. The op is reconciled away once query data reflects it.

  const buildAttrs = useCallback(
    (sessionId: string, roomId: string, startTime: string, endTime: string, isPlenary: boolean) => ({
      session: {_type: 'reference', _ref: sessionId},
      conference: {_type: 'reference', _ref: conferenceId},
      room: {_type: 'reference', _ref: roomId},
      startTime,
      endTime,
      isPlenary,
    }),
    [conferenceId],
  )

  const runCreate = useCallback(
    async (slot: SlotData, undoEntry: UndoEntry | null, successTitle: string) => {
      if (!slot.session || !slot.room) return
      const opId = addOp({kind: 'create', slot})
      const handle = createDocumentHandle({documentId: slot._id, documentType: 'scheduleSlot'})
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK generic types don't know our schema fields
      const attrs: any = buildAttrs(
        slot.session._id,
        slot.room._id,
        slot.startTime,
        slot.endTime,
        slot.isPlenary ?? false,
      )
      try {
        await apply([createDocument(handle, attrs), publishDocument(handle)])
        toast.push({status: 'success', title: successTitle})
        setUndo(undoEntry)
      } catch (err) {
        console.error('[schedule-builder] create failed', err)
        removeOp(opId)
        toast.push({status: 'error', title: 'Could not place session'})
      }
    },
    [addOp, removeOp, apply, buildAttrs, toast],
  )

  const runEdit = useCallback(
    async (
      slot: SlotData,
      target: {roomId: string; startTime: string; endTime: string; isPlenary: boolean},
      undoEntry: UndoEntry | null,
      successTitle: string,
    ) => {
      const sessionId = slot.session?._id
      if (!sessionId) return
      const room = (rooms ?? []).find((r) => r._id === target.roomId) ?? null
      const opId = addOp({
        kind: 'update',
        slotId: slot._id,
        patch: {
          startTime: target.startTime,
          endTime: target.endTime,
          isPlenary: target.isPlenary,
          room,
        },
      })
      const handle = createDocumentHandle({documentId: slot._id, documentType: 'scheduleSlot'})
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK generic types don't know our schema fields
      const attrs: any = buildAttrs(
        sessionId,
        target.roomId,
        target.startTime,
        target.endTime,
        target.isPlenary,
      )
      try {
        // Edit then publish (publish preconditions require the edit to have
        // landed first). No delete involved: if publish fails, the change is
        // safely parked as a draft rather than lost.
        await apply([editDocument(handle, attrs)])
        await apply([publishDocument(handle)])
        toast.push({status: 'success', title: successTitle})
        setUndo(undoEntry)
      } catch (err) {
        console.error('[schedule-builder] edit failed', err)
        removeOp(opId)
        toast.push({status: 'error', title: 'Could not move slot'})
      }
    },
    [addOp, removeOp, apply, buildAttrs, rooms, toast],
  )

  const runRemove = useCallback(
    async (slot: SlotData, undoEntry: UndoEntry | null, successTitle: string) => {
      const opId = addOp({kind: 'remove', slotId: slot._id})
      const handle = createDocumentHandle({documentId: slot._id, documentType: 'scheduleSlot'})
      try {
        await apply([deleteDocument(handle)])
        toast.push({status: 'success', title: successTitle})
        setUndo(undoEntry)
      } catch (err) {
        console.error('[schedule-builder] remove failed', err)
        removeOp(opId)
        toast.push({status: 'error', title: 'Could not remove slot'})
      }
    },
    [addOp, removeOp, apply, toast],
  )

  const placeSession = useCallback(
    (session: SessionData, roomId: string, startTime: string) => {
      const room = (rooms ?? []).find((r) => r._id === roomId) ?? null
      if (!room) return
      const durationMin = session.duration ?? 30
      const slot: SlotData = {
        _id: crypto.randomUUID(),
        startTime,
        endTime: addMinutes(startTime, durationMin),
        isPlenary: false,
        room,
        session,
      }
      onPlaced()
      void runCreate(
        slot,
        {label: `Placed “${session.title}”`, run: () => void runRemove(slot, null, 'Placement undone')},
        'Session placed',
      )
    },
    [rooms, runCreate, runRemove, onPlaced],
  )

  const moveSlot = useCallback(
    (slot: SlotData, roomId: string, startTime: string) => {
      const durationMs = new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()
      const endTime = new Date(new Date(startTime).getTime() + durationMs).toISOString()
      const prev = {
        roomId: slot.room?._id ?? roomId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isPlenary: slot.isPlenary ?? false,
      }
      if (prev.roomId === roomId && prev.startTime === startTime) return
      void runEdit(
        slot,
        {roomId, startTime, endTime, isPlenary: slot.isPlenary ?? false},
        {
          label: `Moved “${slot.session?.title ?? 'slot'}”`,
          run: () => void runEdit(slot, prev, null, 'Move undone'),
        },
        'Slot moved',
      )
    },
    [runEdit],
  )

  const updateSlot = useCallback(
    (data: {slot: SlotData; roomId: string; startTime: string; endTime: string; isPlenary: boolean}) => {
      const prev = {
        roomId: data.slot.room?._id ?? data.roomId,
        startTime: data.slot.startTime,
        endTime: data.slot.endTime,
        isPlenary: data.slot.isPlenary ?? false,
      }
      void runEdit(
        data.slot,
        {roomId: data.roomId, startTime: data.startTime, endTime: data.endTime, isPlenary: data.isPlenary},
        {
          label: `Updated “${data.slot.session?.title ?? 'slot'}”`,
          run: () => void runEdit(data.slot, prev, null, 'Update undone'),
        },
        'Slot updated',
      )
    },
    [runEdit],
  )

  const removeSlot = useCallback(
    (slot: SlotData) => {
      void runRemove(
        slot,
        {
          label: `Removed “${slot.session?.title ?? 'slot'}”`,
          run: () => void runCreate(slot, null, 'Slot restored'),
        },
        'Slot removed',
      )
    },
    [runRemove, runCreate],
  )

  // ---- Drag and drop -------------------------------------------------------
  // The drop row comes from pointer Y within the room column, so what the
  // ghost previews is exactly what a drop commits.

  const dropTargetFromEvent = useCallback(
    (event: {
      over: Over | null
      delta: {x: number; y: number}
      activatorEvent: Event | null
      active: Active
    }): {roomId: string; rowIndex: number} | null => {
      const over = event.over
      const overData = over?.data?.current as {type?: string; roomId?: string} | undefined
      if (!over || overData?.type !== 'column' || !overData.roomId || !over.rect) return null
      const activator = event.activatorEvent as Partial<PointerEvent> | null
      const pointerY =
        typeof activator?.clientY === 'number'
          ? activator.clientY + event.delta.y
          : (event.active.rect.current?.translated?.top ?? over.rect.top)
      const rowIndex = Math.max(
        0,
        Math.min(intervals.length - 1, Math.floor((pointerY - over.rect.top) / ROW_HEIGHT_PX)),
      )
      return {roomId: overData.roomId, rowIndex}
    },
    [intervals.length],
  )

  const ghostForDrag = useCallback(
    (dragData: DragData, roomId: string, rowIndex: number): GhostTarget => {
      const isPlenary = dragData.type === 'slot' ? (dragData.slot.isPlenary ?? false) : false
      const durationMin =
        dragData.type === 'slot'
          ? Math.max(
              INTERVAL_MINUTES,
              (new Date(dragData.slot.endTime).getTime() -
                new Date(dragData.slot.startTime).getTime()) /
                60_000,
            )
          : (dragData.session.duration ?? 30)
      const span = Math.max(1, Math.round(durationMin / INTERVAL_MINUTES))
      const startTime = intervals[rowIndex].start
      const endTime = addMinutes(startTime, durationMin)
      const excludeId = dragData.type === 'slot' ? dragData.slot._id : undefined
      const conflict =
        wouldConflict(startTime, endTime, roomId, isPlenary, slots, excludeId).length > 0
      return {roomId, rowIndex, span, isPlenary, conflict}
    },
    [intervals, slots],
  )

  useDndMonitor({
    onDragMove: (event: DragMoveEvent) => {
      const dragData = event.active.data.current as DragData | undefined
      if (!dragData) return
      const target = dropTargetFromEvent(event)
      setGhost(target ? ghostForDrag(dragData, target.roomId, target.rowIndex) : null)
    },
    onDragEnd: (event: DragEndEvent) => {
      setGhost(null)
      const dragData = event.active.data.current as DragData | undefined
      if (!dragData) return

      // Drop on the sidebar: unschedule
      if (event.over?.id === 'unscheduled-dropzone') {
        if (dragData.type === 'slot') removeSlot(dragData.slot)
        return
      }

      const target = dropTargetFromEvent(event)
      if (!target) return // no valid target — overlay snaps back

      const startTime = intervals[target.rowIndex].start
      if (dragData.type === 'session') {
        placeSession(dragData.session, target.roomId, startTime)
      } else {
        moveSlot(dragData.slot, target.roomId, startTime)
      }
    },
    onDragCancel: () => setGhost(null),
  })

  // Click-to-place (session selected in sidebar, then click the grid)
  const handleColumnClick = useCallback(
    (roomId: string, rowIndex: number) => {
      if (!selectedSession) return
      setGhost(null)
      placeSession(selectedSession, roomId, intervals[rowIndex].start)
    },
    [selectedSession, placeSession, intervals],
  )

  // Clear a lingering hover ghost when click-to-place mode ends
  useEffect(() => {
    if (!selectedSession) setGhost(null)
  }, [selectedSession])

  const handleColumnHover = useCallback(
    (roomId: string, rowIndex: number | null) => {
      if (!selectedSession) return
      setGhost(
        rowIndex === null
          ? null
          : ghostForDrag({type: 'session', session: selectedSession}, roomId, rowIndex),
      )
    },
    [selectedSession, ghostForDrag],
  )

  const handleSlotClick = useCallback((slot: SlotData) => {
    setEditingSlot(slot)
  }, [])

  const handleCloseDialog = useCallback(() => setEditingSlot(null), [])
  const handleDismissUndo = useCallback(() => setUndo(null), [])
  const handleUndo = useCallback(() => {
    undo?.run()
    setUndo(null)
  }, [undo])

  // Hide sessions that are pending placement or already on the visible grid
  const hiddenSessionIds = useMemo(() => {
    const ids = new Set(pendingSessionIds)
    for (const slot of slots) {
      if (slot.session) ids.add(slot.session._id)
    }
    return ids
  }, [pendingSessionIds, slots])

  if (!rooms || rooms.length === 0) {
    return (
      <Card padding={4} flex={1}>
        <Text muted>No rooms found. Create room documents first.</Text>
      </Card>
    )
  }

  // Keep the dialog's slot fresh as pending ops / live updates land
  const editingSlotCurrent = editingSlot
    ? (slots.find((s) => s._id === editingSlot._id) ?? editingSlot)
    : null

  return (
    <>
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
          onSelectSession={onSelectSession}
          hiddenSessionIds={hiddenSessionIds}
          isSlotDragging={isSlotDragging}
          isNarrow={isNarrow}
        />
      </Suspense>
      <Flex direction="column" flex={1} style={{minWidth: 0}}>
        {isNarrow && rooms.length > 1 && (
          <RoomPicker
            rooms={rooms}
            selectedRoomId={visibleRooms[0]?._id ?? rooms[0]._id}
            onSelectRoom={setFocusedRoomId}
          />
        )}
        <TrackLegend slots={slots} />
        <ScheduleGrid
          slots={slots}
          rooms={visibleRooms}
          intervals={intervals}
          ghost={ghost}
          showNowLine={selectedDay === todayInTimezone()}
          onSlotClick={handleSlotClick}
          hasSelectedSession={!!selectedSession}
          onColumnClick={handleColumnClick}
          onColumnHover={handleColumnHover}
        />
      </Flex>
      {editingSlotCurrent && (
        <SlotEditDialog
          slot={editingSlotCurrent}
          rooms={rooms}
          intervals={intervals}
          allSlots={slots}
          onUpdate={updateSlot}
          onRemove={removeSlot}
          onClose={handleCloseDialog}
        />
      )}
      {undo && <UndoBar undo={undo} onUndo={handleUndo} onDismiss={handleDismissUndo} />}
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
        <Flex padding={4} align="center" justify="center" height="fill">
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
