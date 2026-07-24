import {useEffect, useMemo, useState} from 'react'
import {Text, Card} from '@sanity/ui'
import type {SlotData, RoomData, TimeInterval} from '../types'
import {
  getRowForTime,
  getRowSpan,
  ROW_HEIGHT_PX,
  INTERVAL_MINUTES,
} from '../utils/timeGrid'
import {detectRoomConflicts, assignLanes} from '../utils/conflicts'
import {TimeAxis} from './TimeAxis'
import {SlotCard} from './SlotCard'
import {DroppableColumn} from './DroppableColumn'

/** Placement preview rendered while dragging or in click-to-place mode */
export interface GhostTarget {
  roomId: string
  rowIndex: number
  span: number
  isPlenary: boolean
  conflict: boolean
}

interface ScheduleGridProps {
  slots: SlotData[]
  rooms: RoomData[]
  intervals: TimeInterval[]
  ghost: GhostTarget | null
  /** Render the current-time line (selected day is today in conference tz) */
  showNowLine: boolean
  onSlotClick?: (slot: SlotData) => void
  /** Click-to-place: a session is selected */
  hasSelectedSession?: boolean
  onColumnClick?: (roomId: string, rowIndex: number) => void
  onColumnHover?: (roomId: string, rowIndex: number | null) => void
}

/** Check if an interval is on the hour (:00) */
function isHourMark(interval: TimeInterval): boolean {
  return interval.label.endsWith(':00 AM') || interval.label.endsWith(':00 PM')
}

function NowLine({intervals}: {intervals: TimeInterval[]}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const first = new Date(intervals[0].start).getTime()
  const last =
    new Date(intervals[intervals.length - 1].start).getTime() + INTERVAL_MINUTES * 60_000
  if (now < first || now > last) return null

  const minutes = (now - first) / 60_000
  const rowIndex = Math.floor(minutes / INTERVAL_MINUTES)
  const fraction = (minutes % INTERVAL_MINUTES) / INTERVAL_MINUTES

  return (
    <div
      style={{
        gridColumn: '2 / -1',
        gridRow: rowIndex + 2,
        marginTop: fraction * ROW_HEIGHT_PX - 1,
        height: 2,
        background: 'var(--card-critical-fg-color, #f03e2f)',
        zIndex: 3,
        pointerEvents: 'none',
      }}
    />
  )
}

export function ScheduleGrid({
  slots,
  rooms,
  intervals,
  ghost,
  showNowLine,
  onSlotClick,
  hasSelectedSession,
  onColumnClick,
  onColumnHover,
}: ScheduleGridProps) {
  const conflicts = useMemo(() => detectRoomConflicts(slots), [slots])
  const lanes = useMemo(() => assignLanes(slots), [slots])

  // Map room ID to column index (0-based, columns start at 2 in grid)
  const roomColumnMap = useMemo(() => {
    const map = new Map<string, number>()
    rooms.forEach((room, idx) => map.set(room._id, idx + 2)) // col 1 = time axis
    return map
  }, [rooms])

  const totalRows = intervals.length

  return (
    <div
      style={{
        display: 'grid',
        // 140px floor keeps cards readable on narrow screens; the container
        // scrolls horizontally and the time axis stays pinned
        gridTemplateColumns: `56px repeat(${rooms.length}, minmax(140px, 1fr))`,
        gridTemplateRows: `auto repeat(${totalRows}, ${ROW_HEIGHT_PX}px)`,
        alignContent: 'start',
        overflow: 'auto',
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        paddingBottom: 8,
      }}
    >
      {/* Header row: empty corner + room names */}
      <div
        style={{
          gridRow: 1,
          gridColumn: 1,
          position: 'sticky',
          top: 0,
          left: 0,
          zIndex: 6,
          background: 'var(--card-bg-color)',
          borderBottom: '1px solid var(--card-border-color)',
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
            zIndex: 5,
            borderBottom: '1px solid var(--card-border-color)',
            borderLeft: idx > 0 ? '1px solid var(--card-border-color)' : undefined,
          }}
          tone="default"
        >
          <Text size={1} weight="semibold" align="center" textOverflow="ellipsis">
            {room.name}
            {room.capacity ? ` · ${room.capacity}` : ''}
          </Text>
        </Card>
      ))}

      {/* Time axis */}
      <TimeAxis intervals={intervals} />

      {/* Column drop targets (one per room, spanning all rows) */}
      {rooms.map((room, idx) => (
        <DroppableColumn
          key={room._id}
          roomId={room._id}
          gridColumn={roomColumnMap.get(room._id)!}
          totalRows={totalRows}
          isFirst={idx === 0}
          clickable={!!hasSelectedSession}
          onRowClick={onColumnClick}
          onRowHover={onColumnHover}
        />
      ))}

      {/* Hour gridlines spanning all room columns */}
      {intervals.map((interval) => {
        if (!isHourMark(interval)) return null
        return (
          <div
            key={`gridline-${interval.row}`}
            style={{
              gridRow: interval.row + 1,
              gridColumn: `2 / -1`,
              borderTop: '1px solid var(--card-border-color)',
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
        const isPlenary = slot.isPlenary
        // Plenaries span every visible column, so they render even when their
        // stored room isn't shown (e.g. single-room view on narrow screens)
        if (!col && !isPlenary) return null

        const startRow = getRowForTime(slot.startTime, intervals) + 1 // +1 for header
        const span = getRowSpan(slot.startTime, slot.endTime)
        const conflictIds = conflicts.get(slot._id)
        const conflictCount = conflictIds?.length ?? 0

        const gridColumn = isPlenary ? `2 / -1` : `${col}`
        const gridRow = `${startRow} / span ${span}`

        // Side-by-side lanes for overlapping slots in the same room
        const placement = lanes.get(slot._id)
        const laneStyle =
          placement && placement.laneCount > 1
            ? {
                width: `${100 / placement.laneCount}%`,
                marginLeft: `${(100 / placement.laneCount) * placement.lane}%`,
              }
            : undefined

        return (
          <div
            key={slot._id}
            style={{
              gridColumn,
              gridRow,
              // Room slots above plenaries so both stay clickable/grabbable
              zIndex: isPlenary ? 1 : 2,
              padding: '0 2px 2px 2px',
              pointerEvents: 'none',
              ...laneStyle,
            }}
          >
            <div style={{pointerEvents: 'auto', height: '100%'}}>
              <SlotCard
                slot={slot}
                conflictCount={conflictCount}
                onClick={onSlotClick}
                rowSpan={span}
              />
            </div>
          </div>
        )
      })}

      {/* Placement ghost: real footprint of the dragged/selected session */}
      {ghost && roomColumnMap.get(ghost.roomId) && (
        <div
          style={{
            gridColumn: ghost.isPlenary ? '2 / -1' : `${roomColumnMap.get(ghost.roomId)}`,
            gridRow: `${ghost.rowIndex + 2} / span ${ghost.span}`,
            zIndex: 4,
            pointerEvents: 'none',
            margin: '0 2px 2px 2px',
            borderRadius: 3,
            border: ghost.conflict
              ? '2px dashed var(--card-critical-fg-color, #f03e2f)'
              : '2px dashed var(--card-focus-ring-color)',
            background: ghost.conflict
              ? 'color-mix(in srgb, var(--card-critical-fg-color, #f03e2f) 10%, transparent)'
              : 'color-mix(in srgb, var(--card-focus-ring-color) 10%, transparent)',
          }}
        />
      )}

      {showNowLine && intervals.length > 0 && <NowLine intervals={intervals} />}
    </div>
  )
}
