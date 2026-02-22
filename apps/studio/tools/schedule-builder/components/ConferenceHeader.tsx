import {Flex, Heading} from '@sanity/ui'
import {DayPicker} from './DayPicker'

interface ConferenceHeaderProps {
  conferenceName: string
  days: string[]
  selectedDay: string
  onSelectDay: (day: string) => void
  isPending: boolean
}

export function ConferenceHeader({
  conferenceName,
  days,
  selectedDay,
  onSelectDay,
  isPending,
}: ConferenceHeaderProps) {
  return (
    <Flex align="center" gap={4} paddingX={4} paddingY={3} wrap="wrap">
      <Heading size={2}>{conferenceName}</Heading>
      <DayPicker
        days={days}
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
        isPending={isPending}
      />
    </Flex>
  )
}
