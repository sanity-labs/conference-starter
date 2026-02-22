import {useState, startTransition, useMemo, useEffect} from 'react'
import {useQuery} from '@sanity/sdk-react'
import {Stack, TextInput, Select, Text, Card, Flex, Heading, Badge, Button} from '@sanity/ui'
import {SearchIcon, ChevronLeftIcon, ChevronRightIcon} from '@sanity/icons'
import {UNSCHEDULED_QUERY} from '../queries'
import type {SessionData} from '../types'
import {SessionCard} from './SessionCard'

interface UnscheduledPanelProps {
  selectedSessionId: string | null
  onSelectSession: (session: SessionData | null) => void
  hiddenSessionIds?: Set<string>
}

export function UnscheduledPanel({selectedSessionId, onSelectSession, hiddenSessionIds}: UnscheduledPanelProps) {
  const {data: sessions} = useQuery<SessionData[]>({query: UNSCHEDULED_QUERY})

  const [searchText, setSearchText] = useState('')
  const [filterTrack, setFilterTrack] = useState('')
  const [filterType, setFilterType] = useState('')
  const [collapsed, setCollapsed] = useState(false)

  // Auto-collapse when all sessions are scheduled
  useEffect(() => {
    if (sessions && sessions.length === 0) {
      setCollapsed(true)
    }
  }, [sessions])

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
    }
  }

  const sessionCount = filtered.length

  // Collapsed state: thin strip with count + expand button
  if (collapsed) {
    return (
      <Card
        borderRight
        height="fill"
        style={{width: 44, minWidth: 44}}
      >
        <Flex direction="column" align="center" gap={2} paddingY={3}>
          <Button
            icon={ChevronRightIcon}
            mode="bleed"
            fontSize={1}
            padding={2}
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
          />
          {sessionCount > 0 && (
            <Badge tone="primary" fontSize={0}>
              {sessionCount}
            </Badge>
          )}
          <Text
            size={0}
            muted
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              whiteSpace: 'nowrap',
            }}
          >
            {sessionCount} unscheduled
          </Text>
        </Flex>
      </Card>
    )
  }

  return (
    <Card
      borderRight
      height="fill"
      style={{width: 280, minWidth: 200, maxWidth: 320}}
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
                title="Collapse sidebar"
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
          {filtered.length === 0 && (
            <Card padding={3}>
              <Text size={1} muted align="center">
                {sessions && sessions.length === 0
                  ? 'All sessions are scheduled!'
                  : 'No matching sessions.'}
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
}
