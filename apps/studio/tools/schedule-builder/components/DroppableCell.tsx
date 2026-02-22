import {useDroppable} from '@dnd-kit/core'

interface DroppableCellProps {
  roomId: string
  time: string
  gridRow: number
  gridColumn: number
  roomIdx: number
  isClickable: boolean
  hasSelectedSession?: boolean
  onClick?: (roomId: string, time: string) => void
}

export function DroppableCell({
  roomId,
  time,
  gridRow,
  gridColumn,
  roomIdx,
  isClickable,
  hasSelectedSession,
  onClick,
}: DroppableCellProps) {
  const {setNodeRef, isOver} = useDroppable({
    id: `cell-${roomId}-${time}`,
    data: {roomId, time},
  })

  const showHoverHint = isClickable && hasSelectedSession

  return (
    <div
      ref={setNodeRef}
      className={showHoverHint ? 'schedule-cell-droppable' : undefined}
      style={{
        gridRow,
        gridColumn,
        minHeight: 24,
        cursor: isClickable ? 'pointer' : 'default',
        borderLeft:
          roomIdx > 0
            ? '1px solid var(--card-hairline-soft-color, rgba(0,0,0,0.04))'
            : undefined,
        // Alternating column background
        background: isOver
          ? 'var(--card-focus-ring-color, rgba(37,99,235,0.15))'
          : roomIdx % 2 === 1
            ? 'var(--card-hairline-soft-color, rgba(0,0,0,0.02))'
            : undefined,
        // Highlight border when dragging over
        outline: isOver ? '2px solid var(--card-focus-ring-color, #2563eb)' : undefined,
        outlineOffset: isOver ? '-2px' : undefined,
        transition: 'background 100ms, outline 100ms',
      }}
      onClick={onClick ? () => onClick(roomId, time) : undefined}
    />
  )
}
