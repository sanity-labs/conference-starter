import {streamText} from 'ai'
import {sanityInsightsIntegration} from '@sanity/context/ai-sdk'
import {getContentAgentModel} from './ai/content-agent'
import {fetchSystemPrompt} from './ai/prompts'
import {loadConversationHistory} from './conversation/history'
import {cleanMarkdownStream} from './format-telegram'
import {sanityClient} from './sanity-client'

const AGENT_ID = 'telegram-ops'
const MAX_HISTORY_MESSAGES = 20

export async function handleOpsMessage(
  thread: {id: string; post: (text: string | AsyncIterable<string>) => Promise<unknown>},
  message: {text: string},
) {
  const model = await getContentAgentModel(thread.id)
  const systemPrompt = await fetchSystemPrompt('prompt.botOps')

  const history = await loadConversationHistory(AGENT_ID, thread.id, MAX_HISTORY_MESSAGES)

  const messages = [
    ...history.map((m) => ({role: m.role as 'user' | 'assistant', content: m.content})),
    {role: 'user' as const, content: message.text},
  ]

  const result = streamText({
    model,
    system: systemPrompt,
    messages,
    experimental_telemetry: {
      isEnabled: true,
      integrations: [
        sanityInsightsIntegration({
          client: sanityClient,
          agentId: AGENT_ID,
          threadId: thread.id,
        }),
      ],
    },
  })

  await thread.post(cleanMarkdownStream(result.textStream))
  await result.text
}
