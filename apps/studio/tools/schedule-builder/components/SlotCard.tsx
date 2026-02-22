import {Card, Text, Badge, Flex, Stack} from '@sanity/ui'
import type {SlotData} from '../types'

interface SlotCardProps {
  slot: SlotData
  hasConflict?: boolean
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

export function SlotCard({slot, hasConflict, onClick}: SlotCardProps) {
  const session = slot.session
  if (!session) return null

  const trackColor = session.track?.color?.hex
  const tone = hasConflict ? 'critical' : undefined

  return (
    <Card
      padding={2}
      radius={2}
      tone={tone}
      shadow={1}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: trackColor ? `3px solid ${trackColor}` : undefined,
        overflow: 'hidden',
        height: '100%',
      }}
      onClick={onClick ? () => onClick(slot) : undefined}
    >
      <Stack space={1}>
        <Text size={1} weight="semibold" textOverflow="ellipsis">
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
          {hasConflict && (
            <Badge tone="critical" fontSize={0} paddingX={1} paddingY={0}>
              conflict
            </Badge>
          )}
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
