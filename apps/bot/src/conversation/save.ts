import {sanityClient} from '../sanity-client'

const RETRY_DELAY_MS = 500

export async function saveConversation(input: {
  chatId: string
  newMessages: Array<{role: string; content: string}>
  platform?: string
}) {
  const items = input.newMessages.filter((m) => m.content.trim() !== '')
  if (items.length === 0) return

  const platform = input.platform || 'telegram'

  try {
    await sanityClient
      .transaction()
      .createIfNotExists({
        _id: input.chatId,
        _type: 'agent.conversation',
        platform,
        messages: [],
      })
      .patch(input.chatId, (p) => p.setIfMissing({messages: []}).append('messages', items))
      .commit({autoGenerateArrayKeys: true})
  } catch {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    await sanityClient
      .transaction()
      .createIfNotExists({
        _id: input.chatId,
        _type: 'agent.conversation',
        platform,
        messages: [],
      })
      .patch(input.chatId, (p) => p.setIfMissing({messages: []}).append('messages', items))
      .commit({autoGenerateArrayKeys: true})
  }
}
