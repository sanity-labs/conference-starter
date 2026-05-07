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

export function useNowCursor<T extends SlotLike>(slots: T[]): NowCursorState<T> {
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

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
