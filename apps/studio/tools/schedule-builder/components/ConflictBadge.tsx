import {Badge, Tooltip, Box, Text} from '@sanity/ui'
import {WarningOutlineIcon} from '@sanity/icons'

interface ConflictBadgeProps {
  conflictCount: number
}

export function ConflictBadge({conflictCount}: ConflictBadgeProps) {
  if (conflictCount === 0) return null

  return (
    <Tooltip
      content={
        <Box padding={2}>
          <Text size={1}>
            Overlaps with {conflictCount} other slot{conflictCount > 1 ? 's' : ''}
          </Text>
        </Box>
      }
      portal
    >
      <Badge tone="critical" fontSize={0} paddingX={1} paddingY={0}>
        <WarningOutlineIcon />
      </Badge>
    </Tooltip>
  )
}
