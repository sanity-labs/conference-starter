import type {SlotData} from '../types'

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return (
    new Date(aStart).getTime() < new Date(bEnd).getTime() &&
    new Date(bStart).getTime() < new Date(aEnd).getTime()
  )
}

/**
 * Two slots collide when their times overlap AND they compete for space:
 * same room, or either is plenary (a plenary occupies every room).
 */
function slotsCollide(a: SlotData, b: SlotData): boolean {
  if (!timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) return false
  if (a.isPlenary || b.isPlenary) return true
  return !!a.room && !!b.room && a.room._id === b.room._id
}

/**
 * Detect conflicts: overlapping slots in the same room, plus any slot
 * overlapping a plenary (plenaries span all rooms).
 * Returns a Map from slot ID to an array of conflicting slot IDs.
 */
export function detectRoomConflicts(slots: SlotData[]): Map<string, string[]> {
  const conflicts = new Map<string, string[]>()

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i]
      const b = slots[j]
      if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) continue
      if (slotsCollide(a, b)) {
        conflicts.set(a._id, [...(conflicts.get(a._id) ?? []), b._id])
        conflicts.set(b._id, [...(conflicts.get(b._id) ?? []), a._id])
      }
    }
  }

  return conflicts
}

/**
 * Check if a proposed slot would conflict with existing slots.
 * Plenary-aware: a plenary proposal conflicts with everything overlapping,
 * and any proposal conflicts with an overlapping plenary.
 */
export function wouldConflict(
  startTime: string,
  endTime: string,
  roomId: string,
  isPlenary: boolean,
  slots: SlotData[],
  excludeSlotId?: string,
): SlotData[] {
  return slots.filter((slot) => {
    if (slot._id === excludeSlotId) return false
    if (!slot.startTime || !slot.endTime) return false
    if (!timesOverlap(startTime, endTime, slot.startTime, slot.endTime)) return false
    if (isPlenary || slot.isPlenary) return true
    return slot.room?._id === roomId
  })
}

export interface LanePlacement {
  lane: number
  laneCount: number
}

/**
 * Assign side-by-side lanes to overlapping slots within the same room,
 * calendar-style: overlapping slots split the column width instead of
 * stacking on top of each other. Plenary slots are excluded (they render
 * across all rooms). Returns a Map from slot ID to its lane placement.
 */
export function assignLanes(slots: SlotData[]): Map<string, LanePlacement> {
  const placements = new Map<string, LanePlacement>()

  const byRoom = new Map<string, SlotData[]>()
  for (const slot of slots) {
    if (slot.isPlenary || !slot.room || !slot.startTime || !slot.endTime) continue
    const list = byRoom.get(slot.room._id) ?? []
    list.push(slot)
    byRoom.set(slot.room._id, list)
  }

  for (const roomSlots of byRoom.values()) {
    const sorted = [...roomSlots].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    )

    // Build clusters of transitively-overlapping slots
    let cluster: SlotData[] = []
    let clusterEnd = 0
    const flush = () => {
      if (cluster.length === 0) return
      // Greedy lane assignment within the cluster
      const laneEnds: number[] = []
      const lanes = new Map<string, number>()
      for (const slot of cluster) {
        const start = new Date(slot.startTime).getTime()
        let lane = laneEnds.findIndex((end) => end <= start)
        if (lane === -1) {
          lane = laneEnds.length
          laneEnds.push(0)
        }
        laneEnds[lane] = new Date(slot.endTime).getTime()
        lanes.set(slot._id, lane)
      }
      for (const slot of cluster) {
        placements.set(slot._id, {lane: lanes.get(slot._id)!, laneCount: laneEnds.length})
      }
      cluster = []
    }

    for (const slot of sorted) {
      const start = new Date(slot.startTime).getTime()
      if (cluster.length > 0 && start >= clusterEnd) flush()
      cluster.push(slot)
      clusterEnd = Math.max(clusterEnd, new Date(slot.endTime).getTime())
    }
    flush()
  }

  return placements
}
