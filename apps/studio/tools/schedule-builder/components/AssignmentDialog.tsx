import {useState, useMemo} from 'react'
import {
  Dialog,
  Stack,
  Text,
  Button,
  Flex,
  Select,
  Checkbox,
  Card,
  Badge,
  Heading,
  TextInput,
} from '@sanity/ui'
import type {SlotData, RoomData, SessionData, TimeInterval} from '../types'
import {wouldConflict} from '../utils/conflicts'

type AssignmentMode = 'create' | 'edit'

export interface AssignTarget {
  roomId: string
  time: string
}

interface AssignmentDialogProps {
  mode: AssignmentMode
  /** The session being assigned (create mode) */
  session?: SessionData | null
  /** The existing slot being edited (edit mode) */
  slot?: SlotData | null
  /** Target room and time (create mode) */
  target?: AssignTarget | null
  rooms: RoomData[]
  intervals: TimeInterval[]
  allSlots: SlotData[]
  conferenceId: string
  onAssign: (data: {
    sessionId: string
    roomId: string
    startTime: string
    endTime: string
    isPlenary: boolean
  }) => void
  onUpdate: (data: {
    slotId: string
    roomId: string
    startTime: string
    endTime: string
    isPlenary: boolean
  }) => void
  onRemove: (slotId: string) => void
  onClose: () => void
}

export function AssignmentDialog({
  mode,
  session,
  slot,
  target,
  rooms,
  intervals,
  allSlots,
  conferenceId,
  onAssign,
  onUpdate,
  onRemove,
  onClose,
}: AssignmentDialogProps) {
  const initialRoomId = mode === 'edit' ? (slot?.room?._id ?? '') : (target?.roomId ?? '')
  const initialTime = mode === 'edit' ? (slot?.startTime ?? '') : (target?.time ?? '')
  const initialPlenary = mode === 'edit' ? (slot?.isPlenary ?? false) : false

  const [roomId, setRoomId] = useState(initialRoomId)
  const [startTime, setStartTime] = useState(initialTime)
  const [isPlenary, setIsPlenary] = useState(initialPlenary)

  const sessionData = mode === 'edit' ? slot?.session : session
  const duration = sessionData?.duration ?? 30

  // Compute end time from start time + duration
  const endTime = useMemo(() => {
    if (!startTime) return ''
    const start = new Date(startTime)
    return new Date(start.getTime() + duration * 60 * 1000).toISOString()
  }, [startTime, duration])

  // Check for conflicts
  const conflictingSlots = useMemo(() => {
    if (!startTime || !endTime || !roomId) return []
    const excludeId = mode === 'edit' ? slot?._id : undefined
    return wouldConflict(startTime, endTime, roomId, allSlots, excludeId)
  }, [startTime, endTime, roomId, allSlots, mode, slot])

  const handleSubmit = () => {
    if (!roomId || !startTime || !endTime || !sessionData) return

    if (mode === 'create') {
      onAssign({
        sessionId: sessionData._id,
        roomId,
        startTime,
        endTime,
        isPlenary,
      })
    } else if (mode === 'edit' && slot) {
      onUpdate({
        slotId: slot._id,
        roomId,
        startTime,
        endTime,
        isPlenary,
      })
    }
  }

  const title = mode === 'create' ? 'Assign Session' : 'Edit Slot'

  return (
    <Dialog
      id="assignment-dialog"
      header={title}
      onClose={onClose}
      width={1}
    >
      <Card padding={4}>
        <Stack space={4}>
          {/* Session info */}
          {sessionData && (
            <Stack space={2}>
              <Heading size={1}>{sessionData.title}</Heading>
              <Flex gap={2}>
                {sessionData.sessionType && (
                  <Badge fontSize={0}>{sessionData.sessionType}</Badge>
                )}
                <Text size={1} muted>
                  {duration} min
                </Text>
              </Flex>
            </Stack>
          )}

          {/* Room selector */}
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Room
            </Text>
            <Select
              fontSize={1}
              value={roomId}
              onChange={(e) => setRoomId(e.currentTarget.value)}
            >
              <option value="">Select room...</option>
              {rooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name}
                  {room.capacity ? ` (${room.capacity} seats)` : ''}
                </option>
              ))}
            </Select>
          </Stack>

          {/* Start time selector */}
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Start Time
            </Text>
            <Select
              fontSize={1}
              value={startTime}
              onChange={(e) => setStartTime(e.currentTarget.value)}
            >
              <option value="">Select time...</option>
              {intervals.map((interval) => (
                <option key={interval.start} value={interval.start}>
                  {interval.label}
                </option>
              ))}
            </Select>
          </Stack>

          {/* Computed end time */}
          {endTime && (
            <Stack space={2}>
              <Text size={1} weight="semibold">
                End Time
              </Text>
              <Text size={1} muted>
                {new Date(endTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: 'America/New_York',
                })}
              </Text>
            </Stack>
          )}

          {/* Plenary checkbox */}
          <Flex align="center" gap={2}>
            <Checkbox
              id="plenary-checkbox"
              checked={isPlenary}
              onChange={(e) => setIsPlenary(e.currentTarget.checked)}
            />
            <label htmlFor="plenary-checkbox">
              <Text size={1}>Plenary session (spans all rooms)</Text>
            </label>
          </Flex>

          {/* Conflict warning */}
          {conflictingSlots.length > 0 && (
            <Card tone="caution" padding={3} radius={2}>
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  Conflict Warning
                </Text>
                {conflictingSlots.map((cs) => (
                  <Text key={cs._id} size={1}>
                    Overlaps with &ldquo;{cs.session?.title ?? 'Untitled'}&rdquo;
                  </Text>
                ))}
              </Stack>
            </Card>
          )}

          {/* Actions */}
          <Flex gap={2} justify="flex-end">
            {mode === 'edit' && slot && (
              <Button
                tone="critical"
                mode="ghost"
                text="Remove"
                onClick={() => onRemove(slot._id)}
              />
            )}
            <Button mode="ghost" text="Cancel" onClick={onClose} />
            <Button
              tone="primary"
              text={mode === 'create' ? 'Assign' : 'Update'}
              onClick={handleSubmit}
              disabled={!roomId || !startTime || !sessionData}
            />
          </Flex>
        </Stack>
      </Card>
    </Dialog>
  )
}
