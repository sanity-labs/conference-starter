import {Card} from '@sanity/ui'

interface GridCellProps {
  row: number
  column: number
  onClick?: () => void
  isSelected?: boolean
  children?: React.ReactNode
}

export function GridCell({row, column, onClick, isSelected, children}: GridCellProps) {
  return (
    <div
      style={{
        gridRow: row + 1, // +1 for header row
        gridColumn: column + 1, // +1 for time axis column
        minHeight: 20,
        contentVisibility: 'auto',
      }}
    >
      {children ?? (
        <Card
          tone={isSelected ? 'primary' : undefined}
          style={{
            height: '100%',
            minHeight: 20,
            cursor: onClick ? 'pointer' : 'default',
            borderRadius: 2,
          }}
          onClick={onClick}
        />
      )}
    </div>
  )
}
