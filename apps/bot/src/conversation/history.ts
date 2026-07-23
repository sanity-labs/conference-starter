import {generateConversationId} from '@sanity/context/insights'
import {sanityClient} from '../sanity-client'

export async function loadConversationHistory(
  agentId: string,
  threadId: string,
  maxMessages: number,
): Promise<Array<{role: string; content: string}>> {
  const id = generateConversationId(agentId, threadId)
  const doc = await sanityClient.fetch<{
    messages: Array<{role: string; content: string}> | null
  }>(`*[_id == $id][0]{ messages[]{ role, content } }`, {id})

  if (!doc?.messages) return []

  return doc.messages.slice(-maxMessages)
}
