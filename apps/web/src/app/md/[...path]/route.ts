import {markdownResponse, markdownHeader, markdownFooter} from '../_lib/response'

export async function GET(_req: Request, {params}: {params: Promise<{path: string[]}>}) {
  const {path} = await params
  const requestedPath = `/${path.join('/')}`

  const lines: string[] = []
  lines.push(markdownHeader('Page Not Found', {path: requestedPath}))
  lines.push(`The page \`${requestedPath}.md\` does not exist.`)
  lines.push('## Try these instead')
  lines.push(
    [
      '- [Sessions](/sessions.md)',
      '- [Speakers](/speakers.md)',
      '- [Schedule](/schedule.md)',
      '- [FAQ](/faq.md)',
      '- [Venue](/venue.md)',
      '- [Sponsors](/sponsors.md)',
      '- [Announcements](/announcements.md)',
    ].join('\n'),
  )
  lines.push(markdownFooter())

  return new Response(lines.join('\n\n'), {
    status: 404,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  })
}
