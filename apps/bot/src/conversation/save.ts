import {createClient} from '@sanity/client'
import {config} from '../config.js'

const writeClient = createClient({
  projectId: config.sanityProjectId,
  dataset: config.sanityDataset,
  apiVersion: '2026-01-01',
  useCdn: false,
  token: config.sanityToken,
})

export async function saveConversation(input: {
  chatId: string
  messages: Array<{role: string; content: string}>
}) {
  await writeClient.createOrReplace(
    {
      _type: 'agent.conversation',
      _id: input.chatId,
      platform: 'telegram',
      messages: input.messages.filter((m) => m.content.trim() !== ''),
    },
    {autoGenerateArrayKeys: true},
  )
}
