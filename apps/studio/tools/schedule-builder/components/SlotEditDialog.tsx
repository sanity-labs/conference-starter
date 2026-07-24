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
} from '@sanity/ui'
import type {SlotData, RoomData, TimeInterval} from '../types'
import {wouldConflict} from '../utils/conflicts'

interface SlotEditDialogProps {
  slot: SlotData
  rooms: RoomData[]
  intervals: TimeInterval[]
  allSlots: SlotData[]
  onUpdate: (data: {
    slot: SlotData
    roomId: string
    startTime: string
    endTime: string
    isPlenary: boolean
  }) => void
  onRemove: (slot: SlotData) => void
  onClose: () => void
}

/**
 * Edit an existing slot. Placement no longer goes through a dialog —
 * drops and click-to-place commit immediately (with undo).
 * Submitting closes instantly; the mutation continues optimistically.
 */
export function SlotEditDialog({
  slot,
  rooms,
  intervals,
  allSlots,
  onUpdate,
  onRemove,
  onClose,
}: SlotEditDialogProps) {
  const [roomId, setRoomId] = useState(slot.room?._id ?? '')
  const [startTime, setStartTime] = useState(slot.startTime ?? '')
  const [isPlenary, setIsPlenary] = useState(slot.isPlenary ?? false)

  const session = slot.session
  const durationMs = useMemo(() => {
    const fromSlot = new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()
    return fromSlot > 0 ? fromSlot : (session?.duration ?? 30) * 60_000
  }, [slot.startTime, slot.endTime, session])

  const endTime = useMemo(() => {
    if (!startTime) return ''
    return new Date(new Date(startTime).getTime() + durationMs).toISOString()
  }, [startTime, durationMs])

  const conflictingSlots = useMemo(() => {
    if (!startTime || !endTime || !roomId) return []
    return wouldConflict(startTime, endTime, roomId, isPlenary, allSlots, slot._id)
  }, [startTime, endTime, roomId, isPlenary, allSlots, slot._id])

  const handleSubmit = () => {
    if (!roomId || !startTime || !endTime) return
    onUpdate({slot, roomId, startTime, endTime, isPlenary})
    onClose()
  }

  const handleRemove = () => {
    onRemove(slot)
    onClose()
  }

  return (
    <Dialog id="slot-edit-dialog" header="Edit slot" onClose={onClose} width={1}>
      <Card padding={4}>
        <Stack space={4}>
          {session && (
            <Stack space={2}>
              <Heading size={1}>{session.title}</Heading>
              <Flex gap={2}>
                {session.sessionType && <Badge fontSize={0}>{session.sessionType}</Badge>}
                <Text size={1} muted>
                  {Math.round(durationMs / 60_000)} min
                </Text>
              </Flex>
            </Stack>
          )}

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

          <Stack space={2}>
            <Text size={1} weight="semibold">
              Start time
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

          {endTime && (
            <Stack space={2}>
              <Text size={1} weight="semibold">
                End time
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

          {conflictingSlots.length > 0 && (
            <Card tone="caution" padding={3} radius={2}>
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  Conflict warning
                </Text>
                {conflictingSlots.map((cs) => (
                  <Text key={cs._id} size={1}>
                    Overlaps with &ldquo;{cs.session?.title ?? 'Untitled'}&rdquo;
                  </Text>
                ))}
              </Stack>
            </Card>
          )}

          <Flex gap={2} justify="flex-end">
            <Button tone="critical" mode="ghost" text="Remove" onClick={handleRemove} />
            <Button mode="ghost" text="Cancel" onClick={onClose} />
            <Button
              tone="primary"
              text="Update"
              onClick={handleSubmit}
              disabled={!roomId || !startTime}
            />
          </Flex>
        </Stack>
      </Card>
    </Dialog>
  )
}
