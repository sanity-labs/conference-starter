import {describe, it, expect} from 'vitest'
import {detectRoomConflicts, wouldConflict, assignLanes} from './conflicts'
import type {SlotData} from '../types'

const room = (id: string) => ({_id: id, name: id, capacity: null, floor: null, order: null})

function slot(
  id: string,
  roomId: string | null,
  start: string,
  end: string,
  isPlenary = false,
): SlotData {
  return {
    _id: id,
    startTime: start,
    endTime: end,
    isPlenary,
    room: roomId ? room(roomId) : null,
    session: null,
  }
}

const T = (hhmm: string) => `2026-10-15T${hhmm}:00-04:00`

describe('detectRoomConflicts', () => {
  it('flags overlapping slots in the same room', () => {
    const conflicts = detectRoomConflicts([
      slot('a', 'r1', T('10:00'), T('10:30')),
      slot('b', 'r1', T('10:15'), T('10:45')),
    ])
    expect(conflicts.get('a')).toEqual(['b'])
    expect(conflicts.get('b')).toEqual(['a'])
  })

  it('ignores overlapping slots in different rooms', () => {
    const conflicts = detectRoomConflicts([
      slot('a', 'r1', T('10:00'), T('10:30')),
      slot('b', 'r2', T('10:00'), T('10:30')),
    ])
    expect(conflicts.size).toBe(0)
  })

  it('ignores back-to-back slots', () => {
    const conflicts = detectRoomConflicts([
      slot('a', 'r1', T('10:00'), T('10:30')),
      slot('b', 'r1', T('10:30'), T('11:00')),
    ])
    expect(conflicts.size).toBe(0)
  })

  it('flags a plenary against overlapping slots in ANY room', () => {
    const conflicts = detectRoomConflicts([
      slot('plenary', 'r1', T('13:00'), T('14:00'), true),
      slot('other-room', 'r2', T('12:45'), T('13:15')),
    ])
    expect(conflicts.get('plenary')).toEqual(['other-room'])
    expect(conflicts.get('other-room')).toEqual(['plenary'])
  })
})

describe('wouldConflict', () => {
  const existing = [
    slot('a', 'r1', T('10:00'), T('10:30')),
    slot('plenary', 'r1', T('13:00'), T('14:00'), true),
  ]

  it('detects same-room overlap', () => {
    const hits = wouldConflict(T('10:15'), T('10:45'), 'r1', false, existing)
    expect(hits.map((s) => s._id)).toEqual(['a'])
  })

  it('excludes the slot being edited (no self-conflict)', () => {
    const hits = wouldConflict(T('10:00'), T('10:30'), 'r1', false, existing, 'a')
    expect(hits).toEqual([])
  })

  it('detects overlap with a plenary from another room', () => {
    const hits = wouldConflict(T('13:30'), T('14:00'), 'r2', false, existing)
    expect(hits.map((s) => s._id)).toEqual(['plenary'])
  })

  it('a plenary proposal conflicts with everything overlapping', () => {
    const hits = wouldConflict(T('10:15'), T('10:45'), 'r3', true, existing)
    expect(hits.map((s) => s._id)).toEqual(['a'])
  })

  it('no conflict when times are clear', () => {
    const hits = wouldConflict(T('11:00'), T('11:30'), 'r1', false, existing)
    expect(hits).toEqual([])
  })
})

describe('assignLanes', () => {
  it('gives non-overlapping slots full width (no placement)', () => {
    const lanes = assignLanes([
      slot('a', 'r1', T('10:00'), T('10:30')),
      slot('b', 'r1', T('10:30'), T('11:00')),
    ])
    expect(lanes.get('a')).toEqual({lane: 0, laneCount: 1})
    expect(lanes.get('b')).toEqual({lane: 0, laneCount: 1})
  })

  it('splits two overlapping slots side by side', () => {
    const lanes = assignLanes([
      slot('a', 'r1', T('10:00'), T('11:00')),
      slot('b', 'r1', T('10:30'), T('11:30')),
    ])
    expect(lanes.get('a')).toEqual({lane: 0, laneCount: 2})
    expect(lanes.get('b')).toEqual({lane: 1, laneCount: 2})
  })

  it('reuses a freed lane within a cluster', () => {
    const lanes = assignLanes([
      slot('a', 'r1', T('10:00'), T('10:30')),
      slot('b', 'r1', T('10:15'), T('11:00')),
      slot('c', 'r1', T('10:30'), T('11:00')),
    ])
    // c starts when a has ended → reuses lane 0
    expect(lanes.get('a')?.lane).toBe(0)
    expect(lanes.get('b')?.lane).toBe(1)
    expect(lanes.get('c')?.lane).toBe(0)
    expect(lanes.get('c')?.laneCount).toBe(2)
  })

  it('keeps rooms independent and skips plenaries', () => {
    const lanes = assignLanes([
      slot('a', 'r1', T('10:00'), T('11:00')),
      slot('b', 'r2', T('10:00'), T('11:00')),
      slot('p', 'r1', T('10:00'), T('11:00'), true),
    ])
    expect(lanes.get('a')).toEqual({lane: 0, laneCount: 1})
    expect(lanes.get('b')).toEqual({lane: 0, laneCount: 1})
    expect(lanes.has('p')).toBe(false)
  })
})
