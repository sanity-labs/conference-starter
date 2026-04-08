import {sanityClient} from '../sanity-client'

export async function loadConversationHistory(
  chatId: string,
  maxMessages: number,
): Promise<Array<{role: string; content: string}>> {
  const doc = await sanityClient.fetch<{
    messages: Array<{role: string; content: string}> | null
  }>(
    `*[_type == "agent.conversation" && _id == $id][0]{ messages[] { role, content } }`,
    {id: chatId},
  )

  if (!doc?.messages) return []

  // Return last N messages for token cost control
  return doc.messages.slice(-maxMessages)
}
