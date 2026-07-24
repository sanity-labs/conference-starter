import {useCallback, useMemo, useRef, useState} from 'react'
import type {SlotData} from '../types'

/**
 * A local mutation awaiting server confirmation. Each op is applied on top
 * of live query data and is removed individually — either when the query
 * data reflects its effect (reconciliation) or when its mutation fails.
 *
 * This replaces whole-array snapshots: concurrent mutations never stomp
 * each other, and a query emission triggered by someone else's edit can't
 * revert a local pending change.
 */
export type PendingOp =
  | {opId: string; kind: 'create'; slot: SlotData}
  | {opId: string; kind: 'update'; slotId: string; patch: Partial<SlotData>}
  | {opId: string; kind: 'remove'; slotId: string}

/** Omit that distributes over union members (plain Omit collapses the union) */
type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never
export type PendingOpInput = DistributiveOmit<PendingOp, 'opId'>

function applyOp(slots: SlotData[], op: PendingOp): SlotData[] {
  switch (op.kind) {
    case 'create':
      // Guard against double-apply once the server copy arrives
      if (slots.some((s) => s._id === op.slot._id)) return slots
      return [...slots, op.slot]
    case 'update':
      return slots.map((s) => (s._id === op.slotId ? {...s, ...op.patch} : s))
    case 'remove':
      return slots.filter((s) => s._id !== op.slotId)
  }
}

function isReflected(slots: SlotData[], op: PendingOp): boolean {
  switch (op.kind) {
    case 'create':
      return slots.some((s) => s._id === op.slot._id)
    case 'remove':
      return !slots.some((s) => s._id === op.slotId)
    case 'update': {
      const slot = slots.find((s) => s._id === op.slotId)
      // Slot left the day-filtered query (e.g. moved off this day) counts as reflected
      if (!slot) return true
      const p = op.patch
      return (
        (p.startTime === undefined || slot.startTime === p.startTime) &&
        (p.endTime === undefined || slot.endTime === p.endTime) &&
        (p.isPlenary === undefined || (slot.isPlenary ?? false) === (p.isPlenary ?? false)) &&
        (p.room === undefined || slot.room?._id === p.room?._id)
      )
    }
  }
}

export function usePendingOps(serverSlots: SlotData[] | undefined) {
  const [ops, setOps] = useState<Map<string, PendingOp>>(new Map())
  const opCounter = useRef(0)

  const addOp = useCallback((op: PendingOpInput): string => {
    const opId = `op-${++opCounter.current}`
    setOps((prev) => new Map(prev).set(opId, {...op, opId} as PendingOp))
    return opId
  }, [])

  const removeOp = useCallback((opId: string) => {
    setOps((prev) => {
      if (!prev.has(opId)) return prev
      const next = new Map(prev)
      next.delete(opId)
      return next
    })
  }, [])

  const slots = useMemo(() => {
    let result = serverSlots ?? []

    // Reconcile: drop ops the server data already reflects. Done lazily here
    // (not in an effect) so a single render sees consistent data; setOps in
    // render is avoided by only *reading* — cleanup happens on next mutation
    // or via the microtask below.
    const reflected: string[] = []
    for (const op of ops.values()) {
      if (isReflected(result, op)) {
        reflected.push(op.opId)
        continue
      }
      result = applyOp(result, op)
    }
    if (reflected.length > 0) {
      // Defer state cleanup out of render
      queueMicrotask(() => {
        setOps((prev) => {
          let changed = false
          const next = new Map(prev)
          for (const opId of reflected) {
            if (next.delete(opId)) changed = true
          }
          return changed ? next : prev
        })
      })
    }

    return result
  }, [serverSlots, ops])

  /** Session IDs referenced by pending creates — used to hide them from the sidebar without timers */
  const pendingSessionIds = useMemo(() => {
    const ids = new Set<string>()
    for (const op of ops.values()) {
      if (op.kind === 'create' && op.slot.session) ids.add(op.slot.session._id)
    }
    return ids
  }, [ops])

  const hasPending = ops.size > 0

  return {slots, addOp, removeOp, pendingSessionIds, hasPending}
}
