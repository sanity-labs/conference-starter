import {client} from '@/sanity/client'
import {SITE_URL} from '@/lib/metadata'

/**
 * Stega-free client for markdown routes — no visual editing markers.
 * Uses published perspective and CDN for caching.
 */
export const mdClient = client.withConfig({stega: false})

/**
 * YAML frontmatter + title for all markdown routes.
 * Gives AI agents structured metadata they can parse,
 * plus conference context on every page.
 */
export function markdownHeader(
  title: string,
  opts?: {path?: string; description?: string},
): string {
  const fm = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    'conference: ContentOps Conf',
    'dates: October 15–16, 2026',
    'venue: The Glasshouse, NYC',
  ]
  if (opts?.description) fm.push(`description: "${opts.description.replace(/"/g, '\\"')}"`)
  if (opts?.path) fm.push(`url: ${SITE_URL}${opts.path}`)
  fm.push(`sitemap: ${SITE_URL}/sitemap.md`)
  fm.push('---')
  return `${fm.join('\n')}\n\n# ${title}`
}

/**
 * Standard footer for all markdown routes — navigation links.
 */
export function markdownFooter(opts?: {path?: string; parent?: {label: string; href: string}}): string {
  const links = [
    opts?.path && `[View on web](${SITE_URL}${opts.path})`,
    opts?.parent && `[${opts.parent.label}](${opts.parent.href})`,
    '[Sitemap](/sitemap.md)',
  ].filter(Boolean)
  return `---\n\n${links.join(' · ')}`
}

/**
 * Create a markdown Response with proper headers and caching.
 */
export function markdownResponse(body: string): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
