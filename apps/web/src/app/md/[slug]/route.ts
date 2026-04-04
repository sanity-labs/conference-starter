import {mdClient, markdownResponse, markdownHeader, markdownFooter} from '../_lib/response'
import {PAGE_QUERY} from '@repo/sanity-queries'
import {ptToMarkdown} from '@/lib/portable-text-markdown'

export async function GET(_req: Request, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const page = await mdClient.fetch(PAGE_QUERY, {slug})
  if (!page) return new Response('Not found', {status: 404})

  const lines: string[] = []
  lines.push(markdownHeader(page.title ?? slug, {path: `/${slug}`}))

  if (page.sections) {
    for (const section of page.sections) {
      switch (section._type) {
        case 'hero': {
          if (section.heading) lines.push(`## ${section.heading}`)
          if (section.subheading) lines.push(section.subheading)
          break
        }
        case 'richText': {
          if (section.heading) lines.push(`## ${section.heading}`)
          if (section.content) lines.push(ptToMarkdown(section.content as unknown[]))
          break
        }
        case 'ctaBlock': {
          if (section.heading) lines.push(`## ${section.heading}`)
          if (section.body) lines.push(section.body)
          break
        }
        case 'faqSection': {
          if (section.heading) lines.push(`## ${section.heading}`)
          if (section.items) {
            for (const item of section.items) {
              if (item.question) lines.push(`### ${item.question}`)
              if (item.answer) lines.push(ptToMarkdown(item.answer as unknown[]))
            }
          }
          break
        }
        case 'speakerGrid': {
          if (section.heading) lines.push(`## ${section.heading}`)
          if (section.speakers) {
            for (const speaker of section.speakers) {
              lines.push(`- [${speaker.name}](/speakers/${speaker.slug}.md)${speaker.role ? ` — ${speaker.role}` : ''}`)
            }
          }
          break
        }
        case 'sponsorBar': {
          if (section.heading) lines.push(`## ${section.heading}`)
          lines.push('[View sponsors](/sponsors.md)')
          break
        }
        case 'schedulePreview': {
          if (section.heading) lines.push(`## ${section.heading}`)
          lines.push('[View full schedule](/schedule.md)')
          break
        }
      }
    }
  }

  lines.push(markdownFooter({path: `/${slug}`}))

  return markdownResponse(lines.join('\n\n'))
}
