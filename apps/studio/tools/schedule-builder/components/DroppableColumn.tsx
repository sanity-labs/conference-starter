import {useDroppable} from '@dnd-kit/core'
import {ROW_HEIGHT_PX} from '../utils/timeGrid'

interface DroppableColumnProps {
  roomId: string
  gridColumn: number
  totalRows: number
  isFirst: boolean
  /** Click-to-place mode: a session is selected and clicks/hovers preview placement */
  clickable: boolean
  onRowClick?: (roomId: string, rowIndex: number) => void
  onRowHover?: (roomId: string, rowIndex: number | null) => void
}

/**
 * One droppable per room column (instead of one per 15-min cell). Drop row is
 * derived from pointer Y, so drops work anywhere in the column — including
 * over existing cards — and dnd-kit only has a handful of rects to measure.
 */
export function DroppableColumn({
  roomId,
  gridColumn,
  totalRows,
  isFirst,
  clickable,
  onRowClick,
  onRowHover,
}: DroppableColumnProps) {
  const {setNodeRef} = useDroppable({
    id: `column-${roomId}`,
    data: {type: 'column', roomId},
  })

  const rowFromEvent = (e: React.MouseEvent<HTMLDivElement>): number => {
    const rect = e.currentTarget.getBoundingClientRect()
    const idx = Math.floor((e.clientY - rect.top) / ROW_HEIGHT_PX)
    return Math.max(0, Math.min(totalRows - 1, idx))
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        gridColumn,
        gridRow: `2 / span ${totalRows}`,
        zIndex: 0,
        cursor: clickable ? 'copy' : undefined,
        borderLeft: isFirst ? undefined : '1px solid var(--card-border-color)',
      }}
      onClick={clickable && onRowClick ? (e) => onRowClick(roomId, rowFromEvent(e)) : undefined}
      onMouseMove={clickable && onRowHover ? (e) => onRowHover(roomId, rowFromEvent(e)) : undefined}
      onMouseLeave={clickable && onRowHover ? () => onRowHover(roomId, null) : undefined}
    />
  )
}
