import {sanityClient} from '../sanity-client'

const TELEGRAM_FORMAT_SUFFIX = `

FORMATTING: You are writing for Telegram plain text. Do NOT use markdown formatting (no **bold**, *italic*, # headings, \`code\`, or [links](url)). Use plain text, line breaks, and simple bullet characters (•) for lists. Emoji are fine.`

const cache = new Map<string, {instruction: string; fetchedAt: number}>()

export async function fetchSystemPrompt(promptId: string): Promise<string> {
  const cached = cache.get(promptId)
  if (cached && Date.now() - cached.fetchedAt < 60_000) {
    return cached.instruction
  }

  const doc = await sanityClient.fetch<{instruction: string | null}>(
    `*[_id == $id][0]{ instruction }`,
    {id: promptId},
  )

  if (!doc?.instruction) {
    throw new Error(`Prompt ${promptId} not found or empty`)
  }

  const instruction = doc.instruction + TELEGRAM_FORMAT_SUFFIX
  cache.set(promptId, {instruction, fetchedAt: Date.now()})
  return instruction
}
