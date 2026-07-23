import {scheduledEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'
import {classifyConversations} from '@sanity/context/insights'
import {createAnthropic} from '@ai-sdk/anthropic'

const PROJECT_ID = 'yjorde43'
const DATASET = 'production'

export const handler = scheduledEventHandler(async ({context}) => {
  const dryRun = Boolean(context.local)
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set — skipping classification run')
    return
  }

  const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: '2026-03-15',
    token: context.clientOptions?.token,
    useCdn: false,
  })

  if (dryRun) {
    console.log('[dry-run] would call classifyConversations()')
    return
  }

  const anthropic = createAnthropic({apiKey})

  const result = await classifyConversations({
    client,
    model: anthropic('claude-haiku-4-5'),
    telemetry: {shareMetrics: false},
  })

  console.log(
    `Classified ${result.successCount}/${result.totalFound}` +
      (result.errorCount > 0 ? ` (${result.errorCount} failed)` : ''),
  )
})
