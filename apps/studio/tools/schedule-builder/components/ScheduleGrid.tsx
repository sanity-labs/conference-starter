import {useMemo} from 'react'
import {Text, Card} from '@sanity/ui'
import type {SlotData, RoomData, TimeInterval} from '../types'
import {getRowForTime, getRowSpan} from '../utils/timeGrid'
import {buildSlotIndex, detectRoomConflicts} from '../utils/conflicts'
import {TimeAxis} from './TimeAxis'
import {SlotCard} from './SlotCard'

interface ScheduleGridProps {
  slots: SlotData[]
  rooms: RoomData[]
  intervals: TimeInterval[]
  onSlotClick?: (slot: SlotData) => void
  onCellClick?: (roomId: string, time: string) => void
}

export function ScheduleGrid({
  slots,
  rooms,
  intervals,
  onSlotClick,
  onCellClick,
}: ScheduleGridProps) {
  const conflicts = useMemo(() => detectRoomConflicts(slots), [slots])
  const slotIndex = useMemo(() => buildSlotIndex(slots), [slots])

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
  const totalCols = rooms.length + 1 // +1 for time axis

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `80px repeat(${rooms.length}, minmax(140px, 1fr))`,
        gridTemplateRows: `auto repeat(${totalRows}, 20px)`,
        gap: 1,
        overflow: 'auto',
        flex: 1,
      }}
    >
      {/* Header row: empty corner + room names */}
      <div style={{gridRow: 1, gridColumn: 1}} />
      {rooms.map((room, idx) => (
        <Card
          key={room._id}
          padding={2}
          style={{
            gridRow: 1,
            gridColumn: idx + 2,
            position: 'sticky',
            top: 0,
            zIndex: 2,
          }}
          tone="transparent"
        >
          <Text size={1} weight="semibold" align="center">
            {room.name}
          </Text>
          {room.capacity && (
            <Text size={0} muted align="center">
              {room.capacity} seats
            </Text>
          )}
        </Card>
      ))}

      {/* Time axis */}
      <TimeAxis intervals={intervals} />

      {/* Slot cards positioned in the grid */}
      {slots.map((slot) => {
        if (!slot.room || !slot.startTime || !slot.endTime) return null
        const col = roomColumnMap.get(slot.room._id)
        if (!col) return null

        const startRow = getRowForTime(slot.startTime, intervals) + 1 // +1 for header
        const span = getRowSpan(slot.startTime, slot.endTime)
        const hasConflict = conflicts.has(slot._id)

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
              padding: 1,
            }}
          >
            <SlotCard slot={slot} hasConflict={hasConflict} onClick={onSlotClick} />
          </div>
        )
      })}

      {/* Empty cells for click targets (only where no slot exists) */}
      {rooms.map((room) =>
        intervals.map((interval) => {
          const cellKey = `${room._id}:${interval.row}`
          if (occupiedCells.has(cellKey)) return null

          return (
            <div
              key={`empty-${room._id}-${interval.row}`}
              style={{
                gridRow: interval.row + 1,
                gridColumn: roomColumnMap.get(room._id),
                minHeight: 20,
                cursor: onCellClick ? 'pointer' : 'default',
              }}
              onClick={onCellClick ? () => onCellClick(room._id, interval.start) : undefined}
            />
          )
        }),
      )}
    </div>
  )
}
