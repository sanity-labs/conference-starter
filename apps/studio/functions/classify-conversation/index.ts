import {documentEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'

interface ConversationEvent {
  _id: string
  messages: Array<{role: string; content: string}> | null
  summary: string | null
}

export const handler = documentEventHandler<ConversationEvent>(async ({context, event}) => {
  const {data} = event
  const dryRun = Boolean(context.local)
  const client = createClient({
    ...context.clientOptions,
    apiVersion: '2026-01-01',
  })

  if (!data.messages || data.messages.length === 0) {
    console.log(`Skipping ${data._id} — no messages`)
    return
  }

  if (dryRun) {
    console.log(`[dry-run] classify-conversation triggered for ${data._id}`)
    console.log(`[dry-run] ${data.messages.length} messages to classify`)
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set')
    return
  }

  try {
    const transcript = data.messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Analyze this conversation between a conference organizer and an AI operations assistant.

${transcript}

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "summary": "1-2 sentence summary of what was discussed",
  "successRate": <0-100 number: did the conversation achieve its goal?>,
  "agentConfusion": <0-100 number: how much did the agent struggle?>,
  "userConfusion": <0-100 number: how unclear was the user?>,
  "contentGap": "content the agent could not find, or null if none"
}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
    }

    const result = (await response.json()) as {
      content: Array<{type: string; text: string}>
    }

    const text = result.content[0]?.text
    if (!text) throw new Error('Empty response from Anthropic')

    const parsed = JSON.parse(text) as {
      summary: string
      successRate: number
      agentConfusion: number
      userConfusion: number
      contentGap: string | null
    }

    // Only write classification fields — never messages (prevents infinite loop)
    await client
      .patch(data._id)
      .set({
        summary: parsed.summary,
        'classification.successRate': Math.round(parsed.successRate),
        'classification.agentConfusion': Math.round(parsed.agentConfusion),
        'classification.userConfusion': Math.round(parsed.userConfusion),
        ...(parsed.contentGap ? {contentGap: parsed.contentGap} : {}),
      })
      .commit()

    console.log(`Classified ${data._id}: success=${parsed.successRate}`)
  } catch (error) {
    console.error(`Failed to classify ${data._id}:`, error)
  }
})
