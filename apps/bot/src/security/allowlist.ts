import {createClient} from '@sanity/client'
import {config} from '../config.js'

const client = createClient({
  projectId: config.sanityProjectId,
  dataset: config.sanityDataset,
  apiVersion: '2025-11-01',
  useCdn: false,
  token: config.sanityToken,
})

let allowedIds: Set<string> | null = null
let lastFetched = 0
const CACHE_TTL = 60_000

async function getOrganizerTelegramIds(): Promise<Set<string>> {
  if (allowedIds && Date.now() - lastFetched < CACHE_TTL) {
    return allowedIds
  }

  const result = await client.fetch<Array<{telegramId: string | null}>>(
    `*[_type == "conference"][0].organizers[]->{ telegramId }`,
  )

  allowedIds = new Set(
    (result ?? []).map((r) => r.telegramId).filter((id): id is string => !!id),
  )
  lastFetched = Date.now()
  return allowedIds
}

export async function isAllowedOrganizer(userId: string | undefined): Promise<boolean> {
  if (!userId) return false
  const ids = await getOrganizerTelegramIds()
  return ids.has(userId)
}
