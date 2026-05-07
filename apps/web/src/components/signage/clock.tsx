'use client'

import {useEffect, useState} from 'react'

const TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/New_York',
})

export function Clock() {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    setTime(TIME_FORMATTER.format(new Date()))
    const id = setInterval(() => {
      setTime(TIME_FORMATTER.format(new Date()))
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  return <span suppressHydrationWarning>{time ?? '--:--'}</span>
}
