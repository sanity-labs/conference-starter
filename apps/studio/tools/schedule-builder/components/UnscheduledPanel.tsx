import {useState, startTransition, useMemo, useEffect, useRef} from 'react'
import {useQuery} from '@sanity/sdk-react'
import {useDroppable} from '@dnd-kit/core'
import {Stack, TextInput, Select, Text, Card, Flex, Heading, Badge, Button} from '@sanity/ui'
import {SearchIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon} from '@sanity/icons'
import {UNSCHEDULED_QUERY} from '../queries'
import type {SessionData} from '../types'
import {SessionCard} from './SessionCard'

interface UnscheduledPanelProps {
  selectedSessionId: string | null
  onSelectSession: (session: SessionData | null) => void
  /** Sessions to hide: pending placements + sessions already on the visible grid */
  hiddenSessionIds?: Set<string>
  /** A slot is being dragged — the panel becomes a drop-to-unschedule target */
  isSlotDragging?: boolean
  /** Narrow viewport: the expanded panel overlays the grid as a drawer */
  isNarrow?: boolean
}

export function UnscheduledPanel({
  selectedSessionId,
  onSelectSession,
  hiddenSessionIds,
  isSlotDragging,
  isNarrow,
}: UnscheduledPanelProps) {
  const {data: sessions} = useQuery<SessionData[]>({query: UNSCHEDULED_QUERY})

  const [searchText, setSearchText] = useState('')
  const [filterTrack, setFilterTrack] = useState('')
  const [filterType, setFilterType] = useState('')
  const [collapsed, setCollapsed] = useState(!!isNarrow)

  const {setNodeRef, isOver} = useDroppable({id: 'unscheduled-dropzone'})

  // Filter sessions
  const filtered = useMemo(() => {
    if (!sessions) return []
    return sessions.filter((s) => {
      if (hiddenSessionIds?.has(s._id)) return false
      if (searchText && !s.title.toLowerCase().includes(searchText.toLowerCase())) return false
      if (filterTrack && s.track?._id !== filterTrack) return false
      if (filterType && s.sessionType !== filterType) return false
      return true
    })
  }, [sessions, searchText, filterTrack, filterType, hiddenSessionIds])

  const visibleCount = useMemo(
    () => (sessions ?? []).filter((s) => !hiddenSessionIds?.has(s._id)).length,
    [sessions, hiddenSessionIds],
  )

  // Auto-collapse when everything is scheduled; auto-expand when work returns
  // (skip auto-expand on narrow screens — the drawer would cover the grid)
  const prevCountRef = useRef(visibleCount)
  useEffect(() => {
    const prev = prevCountRef.current
    prevCountRef.current = visibleCount
    if (visibleCount === 0 && prev > 0) setCollapsed(true)
    if (visibleCount > 0 && prev === 0 && !isNarrow) setCollapsed(false)
  }, [visibleCount, isNarrow])

  // Extract unique tracks and types for filter dropdowns
  const tracks = useMemo(() => {
    if (!sessions) return []
    const trackMap = new Map<string, string>()
    for (const s of sessions) {
      if (s.track) trackMap.set(s.track._id, s.track.name)
    }
    return Array.from(trackMap.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [sessions])

  const types = useMemo(() => {
    if (!sessions) return []
    const typeSet = new Set<string>()
    for (const s of sessions) {
      if (s.sessionType) typeSet.add(s.sessionType)
    }
    return Array.from(typeSet).sort()
  }, [sessions])

  const handleSearch = (value: string) => {
    startTransition(() => setSearchText(value))
  }

  const handleTrackFilter = (value: string) => {
    startTransition(() => setFilterTrack(value))
  }

  const handleTypeFilter = (value: string) => {
    startTransition(() => setFilterType(value))
  }

  const handleClick = (session: SessionData) => {
    if (selectedSessionId === session._id) {
      onSelectSession(null)
    } else {
      onSelectSession(session)
      // Close the drawer so the full grid is visible for tap-to-place
      if (isNarrow) setCollapsed(true)
    }
  }

  const dropHighlight = isSlotDragging
    ? {
        outline: isOver
          ? '2px dashed var(--card-critical-fg-color, #f03e2f)'
          : '2px dashed var(--card-border-color)',
        outlineOffset: -4,
      }
    : undefined

  // Thin rail: collapsed state, and the always-present anchor on narrow
  // screens. Stays fixed-width during drags (a width change would shift the
  // grid mid-drag and desync pointer→column math); doubles as the
  // unschedule drop target when the full panel isn't mounted.
  const rail = (
    <Card
      ref={collapsed ? setNodeRef : undefined}
      borderRight
      height="fill"
      tone={collapsed && isSlotDragging && isOver ? 'critical' : undefined}
      style={{width: 44, minWidth: 44, ...(collapsed ? dropHighlight : undefined)}}
    >
      <Flex direction="column" align="center" gap={3} paddingY={3}>
        {collapsed && isSlotDragging ? (
          <Text size={1} muted={!isOver}>
            <TrashIcon />
          </Text>
        ) : (
          <>
            <Button
              icon={collapsed ? ChevronRightIcon : ChevronLeftIcon}
              mode="bleed"
              fontSize={1}
              padding={2}
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Show unscheduled sessions' : 'Hide unscheduled sessions'}
            />
            <Badge tone={visibleCount > 0 ? 'caution' : 'positive'} fontSize={0}>
              {visibleCount}
            </Badge>
          </>
        )}
      </Flex>
    </Card>
  )

  const panel = (
    <Card
      ref={collapsed ? undefined : setNodeRef}
      borderRight
      height="fill"
      style={{
        width: 280,
        minWidth: 200,
        maxWidth: 320,
        ...(isNarrow
          ? {
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 15,
              boxShadow: '0 0 0 1px var(--card-border-color), 8px 0 24px rgba(0,0,0,0.12)',
            }
          : undefined),
        ...dropHighlight,
      }}
    >
      <Flex direction="column" height="fill">
        <Card padding={3} borderBottom>
          <Stack space={3}>
            <Flex align="center" gap={2}>
              <Heading size={1} style={{flex: 1}}>
                Unscheduled
              </Heading>
              <Badge tone="default" fontSize={0}>
                {filtered.length}
              </Badge>
              <Button
                icon={ChevronLeftIcon}
                mode="bleed"
                fontSize={1}
                padding={2}
                onClick={() => setCollapsed(true)}
                title="Hide unscheduled sessions"
              />
            </Flex>
            <TextInput
              icon={SearchIcon}
              placeholder="Search sessions..."
              value={searchText}
              onChange={(e) => handleSearch(e.currentTarget.value)}
              fontSize={1}
            />
            <Flex gap={2}>
              <Select
                fontSize={1}
                value={filterTrack}
                onChange={(e) => handleTrackFilter(e.currentTarget.value)}
              >
                <option value="">All tracks</option>
                {tracks.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Select>
              <Select
                fontSize={1}
                value={filterType}
                onChange={(e) => handleTypeFilter(e.currentTarget.value)}
              >
                <option value="">All types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </Flex>
          </Stack>
        </Card>
        <Stack space={2} padding={2} overflow="auto" flex={1}>
          {isSlotDragging && (
            <Card padding={3} radius={2} tone={isOver ? 'critical' : 'transparent'} border>
              <Flex align="center" gap={2} justify="center">
                <Text size={1} muted={!isOver}>
                  <TrashIcon />
                </Text>
                <Text size={1} muted={!isOver}>
                  Drop here to unschedule
                </Text>
              </Flex>
            </Card>
          )}
          {filtered.length === 0 && !isSlotDragging && (
            <Card padding={3}>
              <Text size={1} muted align="center">
                {visibleCount === 0 ? 'All sessions are scheduled!' : 'No matching sessions.'}
              </Text>
            </Card>
          )}
          {filtered.map((session) => (
            <SessionCard
              key={session._id}
              session={session}
              isSelected={selectedSessionId === session._id}
              onClick={handleClick}
            />
          ))}
        </Stack>
      </Flex>
    </Card>
  )

  // Narrow: the rail is always mounted (stable layout); the panel overlays
  // the grid as a drawer when expanded. Wide: rail or panel, side by side.
  if (isNarrow) {
    return (
      <>
        {rail}
        {!collapsed && panel}
      </>
    )
  }
  return collapsed ? rail : panel
}
