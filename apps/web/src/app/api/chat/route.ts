import {streamText, stepCountIs, convertToModelMessages, type ToolSet, type UIMessage} from 'ai'
// Direct @ai-sdk/anthropic keeps this starter deployable to any host. A
// Vercel AI Gateway (anthropic/claude-sonnet-4-6 + AI_GATEWAY_API_KEY) is a
// valid optional layer if you want provider failover, cost tracking, and
// OIDC-issued tokens — swap this import for the gateway provider there.
import {createAnthropic} from '@ai-sdk/anthropic'
import {createMCPClient} from '@ai-sdk/mcp'
import {sanityInsightsIntegration} from '@sanity/context/ai-sdk'
import type {SanityClient} from '@sanity/client'
import {client} from '@/sanity/client'
import {createClient} from 'next-sanity'
import {checkRateLimit} from '@/lib/rate-limit-sanity'

let writeClientCache: SanityClient | null = null

function getWriteClient(): SanityClient {
  if (writeClientCache) return writeClientCache
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!projectId || !dataset || !token) {
    throw new Error(
      'Concierge write client unavailable: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, and SANITY_API_WRITE_TOKEN are required',
    )
  }
  writeClientCache = createClient({
    projectId,
    dataset,
    apiVersion: '2026-03-15',
    token,
    useCdn: false,
  })
  return writeClientCache
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

  const rateLimit = await checkRateLimit(getWriteClient(), ip)
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
  const threadId = chatId ?? crypto.randomUUID()

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
      experimental_telemetry: {
        isEnabled: true,
        integrations: [
          sanityInsightsIntegration({
            client: getWriteClient(),
            agentId: 'web-concierge',
            threadId,
          }),
        ],
      },
      onFinish: async () => {
        await mcpClient.close()
      },
    })

    return result.toUIMessageStreamResponse({originalMessages: messages})
  } catch (error) {
    await mcpClient.close()
    throw error
  }
}
