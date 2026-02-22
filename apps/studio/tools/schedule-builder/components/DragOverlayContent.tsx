import {Card, Text, Badge, Flex, Stack} from '@sanity/ui'
import type {SessionData} from '../types'

interface DragOverlayContentProps {
  session: SessionData
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

export function DragOverlayContent({session}: DragOverlayContentProps) {
  const trackColor = session.track?.color?.hex

  return (
    <Card
      padding={2}
      radius={2}
      shadow={2}
      style={{
        width: 200,
        borderLeft: trackColor ? `3px solid ${trackColor}` : undefined,
        cursor: 'grabbing',
      }}
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
          {session.duration && (
            <Text size={0} muted>
              {session.duration}m
            </Text>
          )}
        </Flex>
      </Stack>
    </Card>
  )
}
