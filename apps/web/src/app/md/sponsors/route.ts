import {mdClient, markdownResponse, markdownHeader, markdownFooter} from '../_lib/response'
import {SPONSORS_QUERY} from '@repo/sanity-queries'
import {ptToMarkdown} from '@/lib/portable-text-markdown'

export async function GET() {
  const sponsors = await mdClient.fetch(SPONSORS_QUERY)
  if (!sponsors || sponsors.length === 0) {
    return markdownResponse('# Sponsors\n\nNo sponsors listed yet.')
  }

  const lines: string[] = []
  lines.push(markdownHeader('Sponsors', {path: '/sponsors'}))

  // Group by tier
  const grouped = new Map<string, typeof sponsors>()
  for (const sponsor of sponsors) {
    const tier = sponsor.tier ?? 'other'
    if (!grouped.has(tier)) grouped.set(tier, [])
    grouped.get(tier)!.push(sponsor)
  }

  for (const [tier, items] of grouped) {
    lines.push(`## ${tier.charAt(0).toUpperCase() + tier.slice(1)}`)
    for (const sponsor of items) {
      let line = sponsor.website
        ? `- [${sponsor.name}](${sponsor.website})`
        : `- ${sponsor.name}`
      if (sponsor.description) {
        const desc = ptToMarkdown(sponsor.description as unknown[]).trim()
        if (desc) line += ` — ${desc}`
      }
      lines.push(line)
    }
  }

  lines.push(markdownFooter({path: '/sponsors'}))

  return markdownResponse(lines.join('\n\n'))
}
