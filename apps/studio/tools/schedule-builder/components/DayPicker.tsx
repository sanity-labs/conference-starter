import {TabList, Tab} from '@sanity/ui'
import {formatDayLabel} from '../utils/timeGrid'

interface DayPickerProps {
  days: string[]
  selectedDay: string
  onSelectDay: (day: string) => void
  isPending: boolean
}

export function DayPicker({days, selectedDay, onSelectDay, isPending}: DayPickerProps) {
  if (days.length <= 1) return null

  return (
    <TabList space={1}>
      {days.map((day) => (
        <Tab
          key={day}
          aria-controls="schedule-grid-panel"
          id={`day-tab-${day}`}
          label={formatDayLabel(day)}
          onClick={() => onSelectDay(day)}
          selected={day === selectedDay}
          style={{opacity: isPending && day === selectedDay ? 0.6 : 1}}
        />
      ))}
    </TabList>
  )
}
