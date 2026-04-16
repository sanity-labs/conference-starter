/**
 * Reset demo content — removes bot-created artifacts so the Content Lake
 * is clean for a fresh recording. Keeps seed data intact.
 *
 * Run from apps/studio/:
 *   cp ../../scripts/reset-demo.ts . && npx sanity exec ./reset-demo.ts --with-user-token && rm reset-demo.ts
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-01-01'})

async function resetDemo() {
  // 1. Delete bot-created announcements (keep seed announcements)
  const seedAnnouncementIds = [
    '1lb2FY0w1GVmzEoNxCgmfF', // CFP is now open!
    'xJrvML2F8O9tZhhxOSxfVt', // Schedule published
    'UbRXQSIJ0M8u70jOoIYwuz', // Workshop capacity update
  ]

  const botAnnouncements = await client.fetch<string[]>(
    `*[_type == "announcement" && !(_id in $keep)]._id`,
    {keep: seedAnnouncementIds},
  )
  console.log(`Found ${botAnnouncements.length} bot-created announcements`)

  // 2. Find all conversation docs
  const conversations = await client.fetch<string[]>(
    `*[_type == "agent.conversation"]._id`,
  )
  console.log(`Found ${conversations.length} conversation docs`)

  // 3. Find all chat state docs
  const chatState = await client.fetch<string[]>(
    `*[_id match "chat.state.*"]._id`,
  )
  console.log(`Found ${chatState.length} chat state docs`)

  // 4. Find any draft announcements created by bot
  const draftAnnouncements = await client.fetch<string[]>(
    `*[_type == "announcement" && _id match "drafts.*" && !(_id in $keep)]._id`,
    {keep: seedAnnouncementIds.map((id) => `drafts.${id}`)},
  )
  console.log(`Found ${draftAnnouncements.length} draft announcements`)

  const allIds = [
    ...botAnnouncements,
    ...conversations,
    ...chatState,
    ...draftAnnouncements,
  ]

  if (allIds.length === 0) {
    console.log('Nothing to clean up — Content Lake is already clean.')
    return
  }

  console.log(`\nDeleting ${allIds.length} documents...`)

  // Delete in batches of 50
  for (let i = 0; i < allIds.length; i += 50) {
    const batch = allIds.slice(i, i + 50)
    const tx = client.transaction()
    for (const id of batch) {
      tx.delete(id)
    }
    await tx.commit()
    console.log(`  Deleted batch ${Math.floor(i / 50) + 1} (${batch.length} docs)`)
  }

  console.log('\nDone. Content Lake is clean for recording.')
  console.log('Seed announcements preserved: CFP is now open!, Schedule published, Workshop capacity update')
}

resetDemo().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
