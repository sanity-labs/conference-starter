import {createContentAgent} from 'content-agent'
import type {LanguageModelV3} from '@ai-sdk/provider'
import {config} from '../config.js'

const contentAgent = createContentAgent({
  organizationId: config.sanityOrgId,
  token: config.sanityToken,
})

export function getContentAgentModel(threadId: string): LanguageModelV3 {
  return contentAgent.agent(threadId, {
    application: {key: config.sanityAppKey},
    config: {
      capabilities: {read: true, write: true},
      filter: {
        read: '_type in ["session", "person", "track", "venue", "room", "scheduleSlot", "submission", "conference", "announcement", "sponsor", "prompt"]',
        write: '_type in ["session", "person", "track", "venue", "room", "scheduleSlot", "submission", "conference", "announcement", "sponsor"]',
      },
    },
  })
}

export function getAttendeeAgentModel(threadId: string): LanguageModelV3 {
  return contentAgent.agent(`attendee-${threadId}`, {
    application: {key: config.sanityAppKey},
    config: {
      capabilities: {read: true, write: false},
      filter: {
        read: '_type in ["session", "person", "track", "venue", "room", "scheduleSlot", "conference", "announcement", "sponsor", "faq"]',
      },
    },
  })
}
