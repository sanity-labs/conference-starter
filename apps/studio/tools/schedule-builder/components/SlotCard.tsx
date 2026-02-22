import {Card, Text, Badge, Flex, Stack} from '@sanity/ui'
import {useDraggable} from '@dnd-kit/core'
import type {SlotData} from '../types'
import {ConflictBadge} from './ConflictBadge'

interface SlotCardProps {
  slot: SlotData
  conflictCount?: number
  onClick?: (slot: SlotData) => void
  /** Number of grid rows this card spans — controls content density */
  rowSpan?: number
}

const TYPE_TONES: Record<string, 'primary' | 'positive' | 'caution' | 'critical' | 'default'> = {
  keynote: 'critical',
  talk: 'primary',
  panel: 'positive',
  workshop: 'caution',
  lightning: 'default',
  break: 'default',
  social: 'positive',
}

export function SlotCard({slot, conflictCount = 0, onClick, rowSpan = 4}: SlotCardProps) {
  const session = slot.session
  if (!session) return null

  const trackColor = session.track?.color?.hex
  const tone = conflictCount > 0 ? 'critical' : undefined

  const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
    id: `slot-${slot._id}`,
    data: {type: 'slot' as const, slot},
  })

  // Compact: 1 row (15 min) — title only at size 0
  // Standard: 2 rows (30 min) — title + type/duration badges
  // Full: 3+ rows (45+ min) — title + badges + speakers
  const isCompact = rowSpan <= 1
  const isFull = rowSpan >= 3

  return (
    <Card
      ref={setNodeRef}
      padding={1}
      radius={2}
      tone={tone}
      shadow={1}
      overflow="hidden"
      height="fill"
      style={{
        cursor: onClick ? 'grab' : 'default',
        borderLeft: trackColor ? `3px solid ${trackColor}` : undefined,
        opacity: isDragging ? 0.4 : 1,
        touchAction: 'none',
      }}
      onClick={onClick ? () => onClick(slot) : undefined}
      {...listeners}
      {...attributes}
    >
      {isCompact ? (
        <Flex gap={1} align="center" height="fill">
          <Text size={0} weight="semibold" textOverflow="ellipsis" style={{flex: 1}} title={session.title}>
            {session.title}
          </Text>
          <ConflictBadge conflictCount={conflictCount} />
        </Flex>
      ) : (
        <Stack space={1}>
          <Text size={1} weight="semibold" textOverflow="ellipsis" title={session.title}>
            {session.title}
          </Text>
          <Flex gap={1} wrap="wrap" align="center">
            {session.sessionType && (
              <Badge
                tone={TYPE_TONES[session.sessionType] ?? 'default'}
                fontSize={0}
                paddingX={1}
                paddingY={0}
              >
                {session.sessionType}
              </Badge>
            )}
            {session.duration && (
              <Text size={0} muted>
                {session.duration}m
              </Text>
            )}
            {session.level && (
              <Text size={0} muted>
                {session.level}
              </Text>
            )}
            <ConflictBadge conflictCount={conflictCount} />
          </Flex>
          {isFull && session.speakers && session.speakers.length > 0 && (
            <Text size={0} muted textOverflow="ellipsis">
              {session.speakers.map((s) => s.name).join(', ')}
            </Text>
          )}
          {isFull && session.track && (
            <Text size={0} muted textOverflow="ellipsis">
              {session.track.name}
            </Text>
          )}
        </Stack>
      )}
    </Card>
  )
}
