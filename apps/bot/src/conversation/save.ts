import {sanityClient} from '../sanity-client.js'

export async function saveConversation(input: {
  chatId: string
  messages: Array<{role: string; content: string}>
}) {
  await sanityClient.createOrReplace(
    {
      _type: 'agent.conversation',
      _id: input.chatId,
      platform: 'telegram',
      messages: input.messages.filter((m) => m.content.trim() !== ''),
    },
    {autoGenerateArrayKeys: true},
  )
}
