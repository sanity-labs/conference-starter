/**
 * One-off cleanup: delete legacy custom-schema agent.conversation docs.
 *
 * Run after merging the @sanity/agent-context Insights refactor — the
 * Studio no longer defines an `agent.conversation` schema, so these
 * docs become orphans. New conversations land in the package's built-in
 * `sanity.agentContextConversation` doc type, which is unaffected.
 *
 * Usage (from apps/studio/ — script must be local for --with-user-token to inject):
 *   cp ../../scripts/delete-legacy-conversations.ts . \
 *     && npx sanity exec ./delete-legacy-conversations.ts --with-user-token \
 *     && rm delete-legacy-conversations.ts
 *
 * Idempotent — safe to re-run.
 */

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-03-15'})

async function deleteLegacy() {
  const {projectId, dataset} = client.config()
  console.log(`Deleting legacy agent.conversation docs from ${projectId}/${dataset}...\n`)

  const ids: string[] = await client.fetch(
    `*[_type == "agent.conversation" || _id match "agent.conversation.*"]._id`,
  )

  if (ids.length === 0) {
    console.log('No legacy conversation documents found.')
    return
  }

  console.log(`Found ${ids.length} legacy document(s).`)

  const transaction = client.transaction()
  for (const id of ids) {
    transaction.delete(id)
    transaction.delete(`drafts.${id}`)
  }

  await transaction.commit()
  console.log(`Done! Deleted ${ids.length} legacy document(s).`)
}

deleteLegacy().catch((err) => {
  console.error('Delete failed:', err)
  process.exit(1)
})
