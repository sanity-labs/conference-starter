import {Text} from '@sanity/ui'
import type {TimeInterval} from '../types'

interface TimeAxisProps {
  intervals: TimeInterval[]
}

export function TimeAxis({intervals}: TimeAxisProps) {
  return (
    <>
      {intervals.map((interval) => {
        // Only show labels on the hour and half-hour
        const isHourOrHalf = interval.label.endsWith(':00 AM') ||
          interval.label.endsWith(':00 PM') ||
          interval.label.endsWith(':30 AM') ||
          interval.label.endsWith(':30 PM')

        return (
          <div
            key={interval.start}
            style={{
              gridRow: interval.row + 1, // +1 for header row
              gridColumn: 1,
              paddingRight: 8,
              display: 'flex',
              alignItems: 'start',
              justifyContent: 'flex-end',
              minHeight: 20,
              position: 'sticky',
              left: 0,
              zIndex: 1,
              background: 'var(--card-bg-color)',
            }}
          >
            {isHourOrHalf && (
              <Text size={0} muted style={{whiteSpace: 'nowrap', lineHeight: 1}}>
                {interval.label}
              </Text>
            )}
          </div>
        )
      })}
    </>
  )
}
