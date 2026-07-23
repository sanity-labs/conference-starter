import {stepCountIs, streamText} from 'ai'
// Direct @ai-sdk/anthropic keeps the bot deployable to any host. A Vercel AI
// Gateway is a valid optional layer if you want provider failover, cost
// tracking, and OIDC-issued tokens — swap this import to use the gateway.
import {createAnthropic} from '@ai-sdk/anthropic'
import {sanityInsightsIntegration} from '@sanity/context/ai-sdk'
import {createAgentContextClient} from './ai/agent-context'
import {fetchSystemPrompt} from './ai/prompts'
import {loadConversationHistory} from './conversation/history'
import {cleanMarkdownStream} from './format-telegram'
import {sanityClient} from './sanity-client'
import {config} from './config'

const AGENT_ID = 'telegram-attendee'
const MAX_HISTORY_MESSAGES = 10

export async function handleAttendeeMessage(
  thread: {id: string; post: (text: string | AsyncIterable<string>) => Promise<unknown>},
  message: {text: string},
) {
  const systemPrompt = await fetchSystemPrompt('prompt.botAttendee')
  const history = await loadConversationHistory(AGENT_ID, thread.id, MAX_HISTORY_MESSAGES)

  const messages = [
    ...history.map((m) => ({role: m.role as 'user' | 'assistant', content: m.content})),
    {role: 'user' as const, content: message.text},
  ]

  const anthropic = createAnthropic({apiKey: config.anthropicApiKey})
  const {mcpClient, tools} = await createAgentContextClient({
    mcpUrl: config.mcpUrl,
    readToken: config.readToken,
  })

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-6'),
      system: systemPrompt,
      messages,
      tools,
      stopWhen: stepCountIs(10),
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
  } finally {
    await mcpClient.close()
  }
}
