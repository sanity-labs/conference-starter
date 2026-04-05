import {stepCountIs, streamText} from 'ai'
import {createAnthropic} from '@ai-sdk/anthropic'
import {createAgentContextClient} from './ai/agent-context.js'
import {fetchSystemPrompt} from './ai/prompts.js'
import {saveConversation} from './conversation/save.js'
import {loadConversationHistory} from './conversation/history.js'
import {cleanMarkdownStream, stripMarkdown} from './format-telegram.js'
import {sanitizeDocumentId} from './utils/sanitize.js'
import {config} from './config.js'

const MAX_HISTORY_MESSAGES = 10

export async function handleAttendeeMessage(
  thread: {id: string; post: (text: string | AsyncIterable<string>) => Promise<unknown>},
  message: {text: string},
) {
  const systemPrompt = await fetchSystemPrompt('prompt.botAttendee')
  const chatId = `agent.conversation.attendee-telegram-${sanitizeDocumentId(thread.id)}`

  const history = await loadConversationHistory(chatId, MAX_HISTORY_MESSAGES)

  const messages = [
    ...history.map((m) => ({role: m.role as 'user' | 'assistant', content: m.content})),
    {role: 'user' as const, content: message.text},
  ]

  const anthropic = createAnthropic({apiKey: config.anthropicApiKey})
  const {mcpClient, tools} = await createAgentContextClient({
    mcpUrl: config.mcpUrl,
    readToken: config.readToken,
  })

  let finalText = ''
  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-6'),
      system: systemPrompt,
      messages,
      tools,
      stopWhen: stepCountIs(10),
    })

    await thread.post(cleanMarkdownStream(result.textStream))
    finalText = stripMarkdown(await result.text)
  } finally {
    if (finalText) {
      const allMessages = [
        ...history,
        {role: 'user', content: message.text},
        {role: 'assistant', content: finalText},
      ]
      await saveConversation({chatId, messages: allMessages}).catch(console.error)
    }
    await mcpClient.close()
  }
}
