/**
 * Delete all content documents.
 *
 * Usage (from apps/studio/ — script must be local for --with-user-token to inject):
 *   cp ../../scripts/delete-all-content.ts . && npx sanity exec ./delete-all-content.ts --with-user-token && rm delete-all-content.ts
 *
 * Deletes both published and draft versions in a single transaction
 * to avoid reference integrity issues. Idempotent.
 */

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-03-15'})

const contentTypes = [
  'scheduleSlot',
  'submission',
  'emailLog',
  'announcement',
  'session',
  'room',
  'sponsor',
  'faq',
  'emailTemplate',
  'prompt',
  'page',
  'homepage',
  'afterpage',
  'person',
  'track',
  'venue',
  'conference',
]

async function deleteAll() {
  const {projectId, dataset} = client.config()
  console.log(`Deleting all content from ${projectId}/${dataset}...\n`)

  // Fetch all content document IDs, plus state/conversation docs
  const ids: string[] = await client.fetch(
    `*[_type in $types || _id match "agent.conversation.*" || _id match "chat.state.*"]._id`,
    {types: contentTypes},
  )

  if (ids.length === 0) {
    console.log('No content documents found.')
    return
  }

  console.log(`Found ${ids.length} document(s) to delete.`)

  // Single transaction — deletes all at once, no reference ordering needed
  const transaction = client.transaction()
  for (const id of ids) {
    transaction.delete(id)
    transaction.delete(`drafts.${id}`)
  }

  await transaction.commit()
  console.log(`Done! Deleted ${ids.length} document(s).`)
}

deleteAll().catch((err) => {
  console.error('Delete failed:', err)
  process.exit(1)
})
