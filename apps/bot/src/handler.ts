import {generateText} from 'ai'
import {getContentAgentModel} from './ai/content-agent.js'
import {fetchSystemPrompt} from './ai/prompts.js'
import {saveConversation} from './conversation/save.js'
import {loadConversationHistory} from './conversation/history.js'

const MAX_HISTORY_MESSAGES = 20

export async function handleMessage(
  thread: {id: string; post: (text: string) => Promise<unknown>},
  message: {text: string},
) {
  const model = getContentAgentModel(thread.id)
  const systemPrompt = await fetchSystemPrompt('prompt.botOps')
  const chatId = `agent.conversation.bot-telegram-${thread.id}`

  // Load prior messages for multi-turn context
  const history = await loadConversationHistory(chatId, MAX_HISTORY_MESSAGES)

  const messages = [
    ...history.map((m) => ({role: m.role as 'user' | 'assistant', content: m.content})),
    {role: 'user' as const, content: message.text},
  ]

  const result = await generateText({
    model,
    system: systemPrompt,
    messages,
  })

  // Post complete response to Telegram
  await thread.post(result.text)

  // Persist full conversation to Content Lake
  const allMessages = [
    ...history,
    {role: 'user', content: message.text},
    {role: 'assistant', content: result.text},
  ]

  saveConversation({chatId, messages: allMessages}).catch(console.error)
}
