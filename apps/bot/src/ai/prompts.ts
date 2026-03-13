import {createClient} from '@sanity/client'
import {config} from '../config.js'

const client = createClient({
  projectId: config.sanityProjectId,
  dataset: config.sanityDataset,
  apiVersion: '2025-11-01',
  useCdn: false,
  token: config.sanityToken,
})

const cache = new Map<string, {instruction: string; fetchedAt: number}>()

export async function fetchSystemPrompt(promptId: string): Promise<string> {
  const cached = cache.get(promptId)
  if (cached && Date.now() - cached.fetchedAt < 60_000) {
    return cached.instruction
  }

  const doc = await client.fetch<{instruction: string | null}>(
    `*[_id == $id][0]{ instruction }`,
    {id: promptId},
  )

  if (!doc?.instruction) {
    throw new Error(`Prompt ${promptId} not found or empty`)
  }

  cache.set(promptId, {instruction: doc.instruction, fetchedAt: Date.now()})
  return doc.instruction
}
