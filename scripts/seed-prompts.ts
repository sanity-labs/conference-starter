/**
 * Seed script for AI prompt documents.
 *
 * Usage: pnpm tsx scripts/seed-prompts.ts
 *
 * Requires SANITY_STUDIO_PROJECT_ID, SANITY_STUDIO_DATASET, and SANITY_API_TOKEN
 * env vars, or reads from apps/studio/.env.local.
 */

import {createClient} from '@sanity/client'
import {readFileSync} from 'node:fs'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local from studio
const envPath = resolve(__dirname, '../apps/studio/.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^(\w+)=(.*)$/)
  if (match) env[match[1]] = match[2]
}

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || env.SANITY_STUDIO_DATASET

if (!projectId || !dataset) {
  console.error('Missing SANITY_STUDIO_PROJECT_ID or SANITY_STUDIO_DATASET')
  process.exit(1)
}

const token = process.env.SANITY_API_TOKEN || env.SANITY_API_TOKEN
if (!token) {
  console.error(
    'Missing SANITY_API_TOKEN — add a token with write access to apps/studio/.env.local',
  )
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-11-01',
  token,
  useCdn: false,
})

// ─── Prompt documents ────────────────────────────────────────────────────

const prompts = [
  {
    _id: 'prompt.cfpScreening',
    _type: 'prompt',
    title: 'CFP Screening',
    instruction: `Evaluate this CFP submission against the conference scoring criteria.

Session title: $title
Session type: $sessionType
Abstract: $abstract
Speaker bio: $bio

Scoring criteria:
$criteria

Rate the submission on a scale of 0 to 100 based on:
- Topic relevance and audience fit
- Speaker expertise (based on bio)
- Abstract quality and clarity
- Session type appropriateness

The score field must be a number between 0 and 100.
Write a brief 2-3 sentence evaluation summary explaining the score.`,
    description:
      'Used by the screen-cfp and rescreen-cfp functions to evaluate CFP submissions via Agent Actions. Variables: $title, $sessionType, $abstract, $bio, $criteria.',
  },
]

async function seedPrompts() {
  console.log(`Seeding prompts into ${projectId}/${dataset}...\n`)

  const transaction = client.transaction()

  for (const prompt of prompts) {
    console.log(`  ${prompt._id} — "${prompt.title}"`)
    transaction.createOrReplace(prompt)
  }

  const result = await transaction.commit()
  console.log(`\nDone! ${result.documentIds.length} prompt document(s) created/updated.`)
}

seedPrompts().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
