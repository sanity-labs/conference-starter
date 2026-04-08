import {sanityClient} from '../sanity-client'

const RETRY_DELAY_MS = 500

export async function saveConversation(input: {
  chatId: string
  messages: Array<{role: string; content: string}>
}) {
  const doc = {
    _type: 'agent.conversation' as const,
    _id: input.chatId,
    platform: 'telegram',
    messages: input.messages.filter((m) => m.content.trim() !== ''),
  }

  try {
    await sanityClient.createOrReplace(doc, {autoGenerateArrayKeys: true})
  } catch {
    // Single retry with backoff
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    await sanityClient.createOrReplace(doc, {autoGenerateArrayKeys: true})
  }
}
