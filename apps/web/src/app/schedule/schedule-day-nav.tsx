'use client'

import {useSearchParams, useRouter} from 'next/navigation'

interface ScheduleDayNavProps {
  days: Array<{date: string; label: string}>
}

export function ScheduleDayNav({days}: ScheduleDayNavProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeDay = searchParams.get('day') ?? days[0]?.date

  if (days.length <= 1) return null

  return (
    <nav aria-label="Conference days" className="mt-6 -mx-6 overflow-x-auto px-6 lg:mx-0 lg:px-0">
      <ul className="flex gap-1 whitespace-nowrap" role="list">
        {days.map((day, i) => {
          const isActive = day.date === activeDay
          return (
            <li key={day.date}>
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  if (i === 0) {
                    params.delete('day')
                  } else {
                    params.set('day', day.date)
                  }
                  const qs = params.toString()
                  router.push(`/schedule${qs ? `?${qs}` : ''}`, {scroll: false})
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-surface-muted text-text-primary'
                    : 'text-text-muted hover:bg-surface-alt hover:text-text-primary'
                }`}
                aria-current={isActive ? 'true' : undefined}
              >
                {day.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
