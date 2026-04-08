import {streamText} from 'ai'
import {getContentAgentModel} from './ai/content-agent'
import {fetchSystemPrompt} from './ai/prompts'
import {saveConversation} from './conversation/save'
import {loadConversationHistory} from './conversation/history'
import {cleanMarkdownStream, stripMarkdown} from './format-telegram'
import {sanitizeDocumentId} from './utils/sanitize'

const MAX_HISTORY_MESSAGES = 20

export async function handleOpsMessage(
  thread: {id: string; post: (text: string | AsyncIterable<string>) => Promise<unknown>},
  message: {text: string},
) {
  const model = getContentAgentModel(thread.id)
  const systemPrompt = await fetchSystemPrompt('prompt.botOps')
  const chatId = `agent.conversation.bot-telegram-${sanitizeDocumentId(thread.id)}`

  // Load prior messages for multi-turn context
  const history = await loadConversationHistory(chatId, MAX_HISTORY_MESSAGES)

  const messages = [
    ...history.map((m) => ({role: m.role as 'user' | 'assistant', content: m.content})),
    {role: 'user' as const, content: message.text},
  ]

  const result = streamText({
    model,
    system: systemPrompt,
    messages,
  })

  // Stream response progressively to Telegram, stripping markdown for plain-text display
  await thread.post(cleanMarkdownStream(result.textStream))

  // Wait for stream to complete and get final text for persistence
  const finalText = stripMarkdown(await result.text)

  // Persist full conversation to Content Lake
  const allMessages = [
    ...history,
    {role: 'user', content: message.text},
    {role: 'assistant', content: finalText},
  ]

  saveConversation({chatId, messages: allMessages}).catch(console.error)
}
