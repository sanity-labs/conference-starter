import {mdClient, markdownResponse, markdownHeader, markdownFooter} from '../_lib/response'
import {SPEAKERS_QUERY} from '@repo/sanity-queries'

export async function GET() {
  const speakers = await mdClient.fetch(SPEAKERS_QUERY)
  if (!speakers || speakers.length === 0) {
    return markdownResponse('# Speakers\n\nNo speakers listed yet.')
  }

  const lines: string[] = []
  lines.push(markdownHeader(`Speakers (${speakers.length})`, {path: '/speakers'}))

  for (const speaker of speakers) {
    const info = [speaker.role, speaker.company].filter(Boolean).join(', ')
    let line = `- [${speaker.name}](/speakers/${speaker.slug}.md)`
    if (info) line += ` — ${info}`
    if (speaker.sessionCount) line += ` (${speaker.sessionCount} session${speaker.sessionCount > 1 ? 's' : ''})`
    lines.push(line)
  }

  lines.push(markdownFooter({path: '/speakers'}))

  return markdownResponse(lines.join('\n'))
}
