import {Suspense} from 'react'
import {SanityApp, useQuery} from '@sanity/sdk-react'
import {Flex, Spinner, Text, Heading, Card} from '@sanity/ui'
import {CONFERENCE_QUERY} from '../queries'
import type {ConferenceData} from '../types'

function ConferenceHeader() {
  const {data: conference} = useQuery<ConferenceData>({query: CONFERENCE_QUERY})

  if (!conference) {
    return (
      <Card padding={4}>
        <Text muted>No conference found. Create a conference document first.</Text>
      </Card>
    )
  }

  return (
    <Card padding={4} borderBottom>
      <Heading size={2}>{conference.name}</Heading>
    </Card>
  )
}

function ScheduleContent() {
  return (
    <Flex direction="column" style={{height: '100%'}}>
      <Suspense
        fallback={
          <Card padding={4}>
            <Flex align="center" gap={3}>
              <Spinner muted />
              <Text muted>Loading conference...</Text>
            </Flex>
          </Card>
        }
      >
        <ConferenceHeader />
      </Suspense>
      <Card padding={4} flex={1}>
        <Text muted>Schedule grid will appear here.</Text>
      </Card>
    </Flex>
  )
}

export function ScheduleBuilder() {
  return (
    <SanityApp
      fallback={
        <Flex padding={4} align="center" justify="center" style={{height: '100%'}}>
          <Spinner muted />
        </Flex>
      }
    >
      <ScheduleContent />
    </SanityApp>
  )
}
