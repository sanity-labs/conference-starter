import {useMemo} from 'react'
import {Text, Card} from '@sanity/ui'
import type {SlotData, RoomData, TimeInterval} from '../types'
import {getRowForTime, getRowSpan} from '../utils/timeGrid'
import {detectRoomConflicts} from '../utils/conflicts'
import {TimeAxis} from './TimeAxis'
import {SlotCard} from './SlotCard'
import {DroppableCell} from './DroppableCell'

interface ScheduleGridProps {
  slots: SlotData[]
  rooms: RoomData[]
  intervals: TimeInterval[]
  onSlotClick?: (slot: SlotData) => void
  onCellClick?: (roomId: string, time: string) => void
  /** Whether a session is currently selected for placement */
  hasSelectedSession?: boolean
}

/** Check if an interval is on the hour (:00) */
function isHourMark(interval: TimeInterval): boolean {
  return interval.label.endsWith(':00 AM') || interval.label.endsWith(':00 PM')
}

/** Check if an interval is on the half-hour (:30) */
function isHalfHourMark(interval: TimeInterval): boolean {
  return interval.label.endsWith(':30 AM') || interval.label.endsWith(':30 PM')
}

export function ScheduleGrid({
  slots,
  rooms,
  intervals,
  onSlotClick,
  onCellClick,
  hasSelectedSession,
}: ScheduleGridProps) {
  const conflicts = useMemo(() => detectRoomConflicts(slots), [slots])

  // Map room ID to column index (0-based, columns start at 2 in grid)
  const roomColumnMap = useMemo(() => {
    const map = new Map<string, number>()
    rooms.forEach((room, idx) => map.set(room._id, idx + 2)) // col 1 = time axis
    return map
  }, [rooms])

  // Build set of occupied cells to avoid rendering empty cells where a slot exists
  const occupiedCells = useMemo(() => {
    const set = new Set<string>()
    for (const slot of slots) {
      if (!slot.room || !slot.startTime || !slot.endTime) continue
      const startRow = getRowForTime(slot.startTime, intervals)
      const span = getRowSpan(slot.startTime, slot.endTime)
      for (let r = startRow; r < startRow + span; r++) {
        set.add(`${slot.room._id}:${r}`)
      }
    }
    return set
  }, [slots, intervals])

  const totalRows = intervals.length

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `64px repeat(${rooms.length}, minmax(120px, 1fr))`,
        gridTemplateRows: `auto repeat(${totalRows}, 24px)`,
        overflow: 'auto',
        flex: 1,
        minHeight: 0,
        minWidth: 0,
      }}
    >
      {/* Header row: empty corner + room names */}
      <div
        style={{
          gridRow: 1,
          gridColumn: 1,
          position: 'sticky',
          top: 0,
          zIndex: 3,
          background: 'var(--card-bg-color)',
        }}
      />
      {rooms.map((room, idx) => (
        <Card
          key={room._id}
          padding={2}
          style={{
            gridRow: 1,
            gridColumn: idx + 2,
            position: 'sticky',
            top: 0,
            zIndex: 3,
            borderBottom: '2px solid var(--card-border-color)',
            borderLeft: idx > 0 ? '1px solid var(--card-border-color)' : undefined,
          }}
          tone="default"
        >
          <Text size={1} weight="semibold" align="center">
            {room.name}
            {room.capacity ? ` \u00b7 ${room.capacity}` : ''}
          </Text>
        </Card>
      ))}

      {/* Time axis */}
      <TimeAxis intervals={intervals} />

      {/* Gridline overlays — hour and half-hour marks spanning all room columns */}
      {intervals.map((interval) => {
        const isHour = isHourMark(interval)
        const isHalf = isHalfHourMark(interval)
        if (!isHour && !isHalf) return null

        return (
          <div
            key={`gridline-${interval.row}`}
            style={{
              gridRow: interval.row + 1,
              gridColumn: `2 / -1`,
              borderTop: isHour
                ? '1px solid var(--card-border-color)'
                : '1px dashed var(--card-hairline-soft-color, rgba(0,0,0,0.06))',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )
      })}

      {/* Slot cards positioned in the grid */}
      {slots.map((slot) => {
        if (!slot.room || !slot.startTime || !slot.endTime) return null
        const col = roomColumnMap.get(slot.room._id)
        if (!col) return null

        const startRow = getRowForTime(slot.startTime, intervals) + 1 // +1 for header
        const span = getRowSpan(slot.startTime, slot.endTime)
        const conflictIds = conflicts.get(slot._id)
        const conflictCount = conflictIds?.length ?? 0

        // Plenary: span all room columns
        const isPlenary = slot.isPlenary
        const gridColumn = isPlenary ? `2 / -1` : `${col}`
        const gridRow = `${startRow} / span ${span}`

        return (
          <div
            key={slot._id}
            style={{
              gridColumn,
              gridRow,
              zIndex: 1,
              padding: '0 2px 2px 2px',
              borderLeft:
                !isPlenary && col > 2
                  ? '1px solid var(--card-hairline-soft-color, rgba(0,0,0,0.04))'
                  : undefined,
            }}
          >
            <SlotCard slot={slot} conflictCount={conflictCount} onClick={onSlotClick} rowSpan={span} />
          </div>
        )
      })}

      {/* Empty cells — droppable targets for DnD + click-to-assign */}
      {rooms.map((room, roomIdx) =>
        intervals.map((interval) => {
          const cellKey = `${room._id}:${interval.row}`
          if (occupiedCells.has(cellKey)) return null

          return (
            <DroppableCell
              key={`empty-${room._id}-${interval.row}`}
              roomId={room._id}
              time={interval.start}
              gridRow={interval.row + 1}
              gridColumn={roomColumnMap.get(room._id)!}
              roomIdx={roomIdx}
              isClickable={!!onCellClick}
              hasSelectedSession={hasSelectedSession}
              onClick={onCellClick}
            />
          )
        }),
      )}

      {/* Inline hover styles for droppable cells */}
      <style>{`
        .schedule-cell-droppable:hover {
          background: var(--card-bg-color) !important;
          outline: 1px dashed var(--card-focus-ring-color, #2563eb);
          outline-offset: -1px;
        }
      `}</style>
    </div>
  )
}
