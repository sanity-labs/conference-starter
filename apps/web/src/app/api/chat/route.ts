import {streamText, stepCountIs, type UIMessage} from 'ai'
import {createAnthropic} from '@ai-sdk/anthropic'
import {createMCPClient} from '@ai-sdk/mcp'

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

  const {messages} = (await request.json()) as {messages: UIMessage[]}

  const mcpClient = await createMCPClient({
    transport: {
      type: 'http',
      url: mcpUrl,
      headers: {Authorization: `Bearer ${readToken}`},
    },
  })

  const anthropic = createAnthropic({apiKey: anthropicApiKey})

  try {
    const tools = await mcpClient.tools()

    const result = streamText({
      model: anthropic('claude-sonnet-4-6'),
      system:
        'You are the AI concierge for ContentOps Conf. Help attendees with questions about the schedule, speakers, venue, and other conference details. Be friendly, concise, and helpful. Use the available tools to look up information from the conference database.',
      messages,
      tools,
      stopWhen: stepCountIs(10),
    })

    return result.toUIMessageStreamResponse()
  } finally {
    await mcpClient.close()
  }
}
