import {mdClient, markdownResponse, markdownHeader, markdownFooter} from '../_lib/response'
import {FAQ_QUERY} from '@repo/sanity-queries'
import {ptToMarkdown} from '@/lib/portable-text-markdown'

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  venue: 'Venue',
  schedule: 'Schedule',
  registration: 'Registration',
  accessibility: 'Accessibility',
  conduct: 'Code of Conduct',
  speakers: 'Speakers',
}

export async function GET() {
  const faqs = await mdClient.fetch(FAQ_QUERY)
  if (!faqs || faqs.length === 0) {
    return markdownResponse('# FAQ\n\nNo FAQs available yet.')
  }

  const lines: string[] = []
  lines.push(markdownHeader('Frequently Asked Questions', {path: '/faq'}))

  // Group by category
  const grouped = new Map<string, typeof faqs>()
  for (const faq of faqs) {
    const cat = faq.category ?? 'general'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(faq)
  }

  for (const [category, items] of grouped) {
    const label = CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1)
    lines.push(`## ${label}`)

    for (const faq of items) {
      if (!faq.question) continue
      lines.push(`### ${faq.question}`)
      if (faq.answer) {
        lines.push(ptToMarkdown(faq.answer as unknown[]))
      }
    }
  }

  lines.push(markdownFooter({path: '/faq'}))

  return markdownResponse(lines.join('\n\n'))
}
