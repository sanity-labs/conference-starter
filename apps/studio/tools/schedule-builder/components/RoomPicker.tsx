import {Card, Flex, Button} from '@sanity/ui'
import type {RoomData} from '../types'

interface RoomPickerProps {
  rooms: RoomData[]
  selectedRoomId: string
  onSelectRoom: (roomId: string) => void
}

/**
 * Narrow-screen room switcher: the grid shows one room at a time, this row
 * switches between them (scrolls horizontally if there are many rooms).
 */
export function RoomPicker({rooms, selectedRoomId, onSelectRoom}: RoomPickerProps) {
  return (
    <Card paddingX={2} paddingY={2} borderBottom style={{overflowX: 'auto'}}>
      <Flex gap={1} style={{whiteSpace: 'nowrap'}}>
        {rooms.map((room) => (
          <Button
            key={room._id}
            mode={room._id === selectedRoomId ? 'default' : 'bleed'}
            tone={room._id === selectedRoomId ? 'primary' : 'default'}
            fontSize={1}
            padding={2}
            text={room.name}
            style={{flexShrink: 0}}
            onClick={() => onSelectRoom(room._id)}
          />
        ))}
      </Flex>
    </Card>
  )
}
