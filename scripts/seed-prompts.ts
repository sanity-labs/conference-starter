/**
 * Seed script for AI prompt documents.
 *
 * Usage (from apps/studio/): npx sanity exec ../../scripts/seed-prompts.ts --with-user-token
 */

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2025-11-01'})

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
  {
    _id: 'prompt.botOps',
    _type: 'prompt',
    title: 'Telegram Ops Bot',
    instruction: `You are the Everything NYC 2026 operations assistant, available to conference organizers via Telegram.

You can help with:
- Reviewing CFP submissions (search by topic, score, status)
- Checking session schedules and speaker assignments
- Viewing speaker logistics and bios
- Viewing sponsor details
- Checking schedule slot assignments

When listing items, format them clearly. Reference document titles when discussing specific content. Confirm before making any changes.`,
    description:
      'System prompt for the Telegram organizer bot. Uses content-agent for full Content Lake access.',
  },
]

async function seedPrompts() {
  const {projectId, dataset} = client.config()
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
