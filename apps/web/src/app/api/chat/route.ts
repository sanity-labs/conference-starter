import {streamText, stepCountIs, convertToModelMessages, type ToolSet, type UIMessage} from 'ai'
import {createAnthropic} from '@ai-sdk/anthropic'
import {createMCPClient} from '@ai-sdk/mcp'
import {client} from '@/sanity/client'
import {createClient} from 'next-sanity'
import {checkRateLimit} from '@/lib/rate-limit-sanity'

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-03-15',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

const CONVERSATION_PREFIX = 'agent.conversation.web-'

async function appendMessages(chatId: string, newMessages: Array<{role: string; content: string}>) {
  const items = newMessages.filter((m) => m.content.trim() !== '')
  if (items.length === 0) return

  const docId = `${CONVERSATION_PREFIX}${chatId.replace(/[^a-zA-Z0-9._-]/g, '-')}`
  try {
    await writeClient
      .transaction()
      .createIfNotExists({
        _id: docId,
        _type: 'agent.conversation',
        platform: 'web',
        messages: [],
      })
      .patch(docId, (p) => p.setIfMissing({messages: []}).append('messages', items))
      .commit({autoGenerateArrayKeys: true})
  } catch (err) {
    console.error('Failed to save conversation:', err)
  }
}

const PROMPT_ID = 'prompt.webConcierge'
const FALLBACK_SYSTEM_PROMPT =
  'You are the AI concierge for ContentOps Conf. Help attendees with questions about the schedule, speakers, venue, and other conference details. Be friendly, concise, and helpful.'

const promptCache = {instruction: '', fetchedAt: 0}

async function getSystemPrompt(): Promise<string> {
  if (promptCache.instruction && Date.now() - promptCache.fetchedAt < 60_000) {
    return promptCache.instruction
  }
  const doc = await client.fetch<{instruction: string | null}>(
    `*[_id == $id][0]{ instruction }`,
    {id: PROMPT_ID},
  )
  const instruction = doc?.instruction || FALLBACK_SYSTEM_PROMPT
  promptCache.instruction = instruction
  promptCache.fetchedAt = Date.now()
  return instruction
}

export const maxDuration = 30

export async function POST(request: Request) {
  const mcpUrl = process.env.SANITY_CONTEXT_MCP_URL
  const readToken = process.env.SANITY_API_READ_TOKEN
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY

  if (!mcpUrl || !readToken || !anthropicApiKey) {
    return new Response('AI concierge is not configured', {status: 503})
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const rateLimit = await checkRateLimit(writeClient, ip)
  if (!rateLimit.allowed) {
    const headers: Record<string, string> = {}
    if (rateLimit.resetAt) {
      headers['Retry-After'] = Math.max(
        1,
        Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      ).toString()
    }
    return new Response('Too many requests', {status: 429, headers})
  }

  const {messages, id: chatId} = (await request.json()) as {messages: UIMessage[]; id?: string}

  const [mcpClient, systemPrompt] = await Promise.all([
    createMCPClient({
      transport: {
        type: 'http',
        url: mcpUrl,
        headers: {Authorization: `Bearer ${readToken}`},
      },
    }),
    getSystemPrompt(),
  ])

  const anthropic = createAnthropic({apiKey: anthropicApiKey})

  try {
    const tools = (await mcpClient.tools()) as ToolSet

    const result = streamText({
      model: anthropic('claude-sonnet-4-6'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(10),
      onFinish: async () => {
        await mcpClient.close()
      },
    })

    const existingCount = messages.length

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: chatId
        ? async ({messages: allMessages}) => {
            const newMessages = allMessages.slice(existingCount).map((m) => ({
              role: m.role,
              content: m.parts
                .filter((p): p is {type: 'text'; text: string} => p.type === 'text')
                .map((p) => p.text)
                .join(''),
            }))
            await appendMessages(chatId, newMessages)
          }
        : undefined,
    })
  } catch (error) {
    await mcpClient.close()
    throw error
  }
}
