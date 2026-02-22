import {Card, Text, Badge, Flex, Stack} from '@sanity/ui'
import type {SessionData} from '../types'

interface SessionCardProps {
  session: SessionData
  isSelected?: boolean
  onClick?: (session: SessionData) => void
}

const TYPE_TONES: Record<string, 'primary' | 'positive' | 'caution' | 'critical' | 'default'> = {
  keynote: 'critical',
  talk: 'primary',
  panel: 'positive',
  workshop: 'caution',
  lightning: 'default',
}

export function SessionCard({session, isSelected, onClick}: SessionCardProps) {
  const trackColor = session.track?.color?.hex

  return (
    <Card
      padding={3}
      radius={2}
      shadow={isSelected ? 2 : 1}
      tone={isSelected ? 'primary' : undefined}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: trackColor ? `3px solid ${trackColor}` : undefined,
      }}
      onClick={onClick ? () => onClick(session) : undefined}
    >
      <Stack space={2}>
        <Text size={1} weight="semibold">
          {session.title}
        </Text>
        <Flex gap={2} wrap="wrap" align="center">
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
        </Flex>
        {session.speakers && session.speakers.length > 0 && (
          <Text size={0} muted>
            {session.speakers.map((s) => s.name).join(', ')}
          </Text>
        )}
        {session.track && (
          <Text size={0} muted>
            {session.track.name}
          </Text>
        )}
      </Stack>
    </Card>
  )
}
