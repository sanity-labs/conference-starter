import type {SlotData} from '../types'

/**
 * Build a lookup map: "roomId:timeKey" → SlotData for O(1) cell lookups.
 * timeKey is the ISO start time string.
 */
export function buildSlotIndex(slots: SlotData[]): Map<string, SlotData> {
  const map = new Map<string, SlotData>()
  for (const slot of slots) {
    if (slot.room && slot.startTime) {
      map.set(`${slot.room._id}:${slot.startTime}`, slot)
    }
  }
  return map
}

/**
 * Group slots by room ID for conflict detection.
 */
export function groupSlotsByRoom(slots: SlotData[]): Map<string, SlotData[]> {
  const map = new Map<string, SlotData[]>()
  for (const slot of slots) {
    const roomId = slot.room?._id
    if (!roomId) continue
    const existing = map.get(roomId) ?? []
    existing.push(slot)
    map.set(roomId, existing)
  }
  return map
}

/**
 * Detect room conflicts: overlapping slots in the same room.
 * Returns a Map from slot ID to an array of conflicting slot IDs.
 */
export function detectRoomConflicts(slots: SlotData[]): Map<string, string[]> {
  const conflicts = new Map<string, string[]>()
  const byRoom = groupSlotsByRoom(slots)

  for (const roomSlots of byRoom.values()) {
    const sorted = [...roomSlots].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    )

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i]
        const b = sorted[j]
        // Overlap: a.start < b.end && b.start < a.end
        if (
          new Date(a.startTime).getTime() < new Date(b.endTime).getTime() &&
          new Date(b.startTime).getTime() < new Date(a.endTime).getTime()
        ) {
          const aConflicts = conflicts.get(a._id) ?? []
          aConflicts.push(b._id)
          conflicts.set(a._id, aConflicts)

          const bConflicts = conflicts.get(b._id) ?? []
          bConflicts.push(a._id)
          conflicts.set(b._id, bConflicts)
        }
      }
    }
  }

  return conflicts
}

/**
 * Check if a proposed slot would conflict with existing slots.
 */
export function wouldConflict(
  startTime: string,
  endTime: string,
  roomId: string,
  slots: SlotData[],
  excludeSlotId?: string,
): SlotData[] {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()

  return slots.filter((slot) => {
    if (slot._id === excludeSlotId) return false
    if (slot.room?._id !== roomId) return false
    const slotStart = new Date(slot.startTime).getTime()
    const slotEnd = new Date(slot.endTime).getTime()
    return start < slotEnd && slotStart < end
  })
}
