import {useMemo} from 'react'
import {Card, Flex, Text} from '@sanity/ui'
import type {SlotData} from '../types'

interface TrackLegendProps {
  slots: SlotData[]
}

/** Legend for the track colors shown as card accents on the grid */
export function TrackLegend({slots}: TrackLegendProps) {
  const tracks = useMemo(() => {
    const map = new Map<string, {name: string; color: string | null}>()
    for (const slot of slots) {
      const track = slot.session?.track
      if (track && !map.has(track._id)) {
        map.set(track._id, {name: track.name, color: track.color?.hex ?? null})
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [slots])

  if (tracks.length === 0) return null

  return (
    <Card paddingX={3} paddingY={2} borderBottom style={{overflowX: 'auto'}}>
      <Flex gap={4} align="center" style={{whiteSpace: 'nowrap'}}>
        {tracks.map((track) => (
          <Flex key={track.name} gap={2} align="center" style={{flexShrink: 0}}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                flexShrink: 0,
                background: track.color ?? 'var(--card-border-color)',
              }}
            />
            <Text size={0} muted>
              {track.name}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Card>
  )
}
