import {createClient} from '@sanity/client'
import {config} from '../config.js'

const client = createClient({
  projectId: config.sanityProjectId,
  dataset: config.sanityDataset,
  apiVersion: '2025-11-01',
  useCdn: false,
  token: config.sanityToken,
})

export async function loadConversationHistory(
  chatId: string,
  maxMessages: number,
): Promise<Array<{role: string; content: string}>> {
  const doc = await client.fetch<{
    messages: Array<{role: string; content: string}> | null
  }>(
    `*[_type == "agent.conversation" && _id == $id][0]{ messages[] { role, content } }`,
    {id: chatId},
  )

  if (!doc?.messages) return []

  // Return last N messages for token cost control
  return doc.messages.slice(-maxMessages)
}
