'use client'

import {useEffect, useState} from 'react'

export type SlotLike = {
  _id: string
  startTime?: string | null
  endTime?: string | null
}

export type NowCursorState<T extends SlotLike> = {
  current: T | null
  next: T | null
  upcoming: T[]
  done: T[]
}

export type NowCursorOptions = {
  dayStart?: string
  dayEnd?: string
}

export function useEffectiveNow({dayStart, dayEnd}: NowCursorOptions = {}): number {
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  if (!dayStart) return now
  const start = new Date(dayStart).getTime()
  const end = dayEnd ? new Date(dayEnd).getTime() : start + 24 * 60 * 60_000
  if (now < start) return start
  if (now > end) return end
  return now
}

export function useNowCursor<T extends SlotLike>(
  slots: T[],
  options?: NowCursorOptions,
): NowCursorState<T> {
  const now = useEffectiveNow(options)

  const sorted = [...slots]
    .filter((slot) => Boolean(slot.startTime))
    .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime())

  const current =
    sorted.find((slot) => {
      const start = new Date(slot.startTime!).getTime()
      const end = slot.endTime ? new Date(slot.endTime).getTime() : start + 60 * 60 * 1000
      return start <= now && now < end
    }) ?? null

  const upcoming = sorted.filter((slot) => new Date(slot.startTime!).getTime() > now)
  const done = sorted.filter((slot) => {
    const end = slot.endTime
      ? new Date(slot.endTime).getTime()
      : new Date(slot.startTime!).getTime() + 60 * 60 * 1000
    return end <= now
  })

  const next = upcoming[0] ?? null

  return {current, next, upcoming, done}
}
