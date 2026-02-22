import {Card, Text, Badge, Flex, Stack} from '@sanity/ui'
import {useDraggable} from '@dnd-kit/core'
import type {SlotData} from '../types'
import {ConflictBadge} from './ConflictBadge'

interface SlotCardProps {
  slot: SlotData
  conflictCount?: number
  onClick?: (slot: SlotData) => void
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

export function SlotCard({slot, conflictCount = 0, onClick}: SlotCardProps) {
  const session = slot.session
  if (!session) return null

  const trackColor = session.track?.color?.hex
  const tone = conflictCount > 0 ? 'critical' : undefined

  const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
    id: `slot-${slot._id}`,
    data: {type: 'slot' as const, slot},
  })

  return (
    <Card
      ref={setNodeRef}
      padding={2}
      radius={2}
      tone={tone}
      shadow={1}
      style={{
        cursor: onClick ? 'grab' : 'default',
        borderLeft: trackColor ? `3px solid ${trackColor}` : undefined,
        overflow: 'hidden',
        height: '100%',
        opacity: isDragging ? 0.4 : 1,
        touchAction: 'none',
      }}
      onClick={onClick ? () => onClick(slot) : undefined}
      {...listeners}
      {...attributes}
    >
      <Stack space={1}>
        <Text size={1} weight="semibold" textOverflow="ellipsis" title={session.title}>
          {session.title}
        </Text>
        <Flex gap={1} wrap="wrap">
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
          <ConflictBadge conflictCount={conflictCount} />
        </Flex>
        {session.speakers && session.speakers.length > 0 && (
          <Text size={0} muted textOverflow="ellipsis">
            {session.speakers.map((s) => s.name).join(', ')}
          </Text>
        )}
      </Stack>
    </Card>
  )
}
