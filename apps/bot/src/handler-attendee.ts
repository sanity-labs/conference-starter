import {streamText} from 'ai'
import {getAttendeeAgentModel} from './ai/content-agent.js'
import {fetchSystemPrompt} from './ai/prompts.js'
import {saveConversation} from './conversation/save.js'
import {loadConversationHistory} from './conversation/history.js'
import {cleanMarkdownStream, stripMarkdown} from './format-telegram.js'

const MAX_HISTORY_MESSAGES = 10

export async function handleAttendeeMessage(
  thread: {id: string; post: (text: string | AsyncIterable<string>) => Promise<unknown>},
  message: {text: string},
) {
  const model = getAttendeeAgentModel(thread.id)
  const systemPrompt = await fetchSystemPrompt('prompt.botAttendee')
  const chatId = `agent.conversation.attendee-telegram-${thread.id.replace(/[^a-zA-Z0-9._-]/g, '-')}`

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

  await thread.post(cleanMarkdownStream(result.textStream))

  const finalText = stripMarkdown(await result.text)

  const allMessages = [
    ...history,
    {role: 'user', content: message.text},
    {role: 'assistant', content: finalText},
  ]

  saveConversation({chatId, messages: allMessages}).catch(console.error)
}
