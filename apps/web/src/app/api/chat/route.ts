import {streamText, stepCountIs, convertToModelMessages, type UIMessage} from 'ai'
import {createAnthropic} from '@ai-sdk/anthropic'
import {createMCPClient} from '@ai-sdk/mcp'
import {client} from '@/sanity/client'

const CONVERSATION_PREFIX = 'agent.conversation.web-'

async function saveConversation(chatId: string, messages: UIMessage[]) {
  const textMessages = messages
    .map((m) => ({
      role: m.role,
      content: m.parts
        .filter((p): p is {type: 'text'; text: string} => p.type === 'text')
        .map((p) => p.text)
        .join(''),
    }))
    .filter((m) => m.content.trim() !== '')

  if (textMessages.length === 0) return

  const docId = `${CONVERSATION_PREFIX}${chatId.replace(/[^a-zA-Z0-9._-]/g, '-')}`
  try {
    await client.createOrReplace(
      {
        _id: docId,
        _type: 'agent.conversation',
        platform: 'web',
        messages: textMessages,
      },
      {autoGenerateArrayKeys: true},
    )
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

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20
const rateLimitMap = new Map<string, {count: number; resetAt: number}>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, {count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS})
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT_MAX
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

  if (isRateLimited(ip)) {
    return new Response('Too many requests', {status: 429})
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
    const tools = await mcpClient.tools()

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

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: chatId
        ? async ({messages: allMessages}) => {
            await saveConversation(chatId, allMessages)
          }
        : undefined,
    })
  } catch (error) {
    await mcpClient.close()
    throw error
  }
}
