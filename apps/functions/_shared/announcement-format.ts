/**
 * Shared formatting utilities for announcement distribution.
 * Renders announcement data as HTML (email) or Telegram-safe HTML.
 */

import {escapeHTML} from '@portabletext/to-html'
import type {SanityClient} from '@sanity/client'
import {buildAnnouncementUrl, buildUrl} from './url-builder'

export interface AnnouncementLink {
  _type: string
  label: string | null
  url?: string | null
  reference?: {
    _type: string | null
    slug: string | null
    name: string | null
  } | null
}

export interface AnnouncementData {
  _id: string
  title: string | null
  slug: string | null
  body: string | null
  links: AnnouncementLink[] | null
  distributionLog: {channel: string; sentAt: string; status: string; details: string}[] | null
}

function renderLinks(links: AnnouncementLink[] | null, html: boolean): string {
  if (!links || links.length === 0) return ''

  const items = links
    .map((link) => {
      if (link._type === 'externalLink' && link.url) {
        const label = escapeHTML(link.label || link.url)
        return html
          ? `<li><a href="${escapeHTML(link.url)}">${label}</a></li>`
          : `<a href="${escapeHTML(link.url)}">${label}</a>`
      }
      if (link._type === 'internalLink' && link.reference?.slug && link.reference?._type) {
        const href = buildUrl(link.reference._type, link.reference.slug)
        const label = escapeHTML(link.label || link.reference.name || 'Link')
        return html
          ? `<li><a href="${escapeHTML(href)}">${label}</a></li>`
          : `<a href="${escapeHTML(href)}">${label}</a>`
      }
      return null
    })
    .filter(Boolean)

  if (items.length === 0) return ''
  return html ? `<ul>${items.join('')}</ul>` : items.join('\n')
}

export function formatEmailHtml(data: AnnouncementData, isUpdate: boolean): string {
  const title = escapeHTML(data.title || 'Announcement')
  const prefix = isUpdate ? '<p><strong>UPDATED:</strong></p>' : ''
  const body = escapeHTML(data.body || '').replace(/\n/g, '<br>')
  const links = renderLinks(data.links, true)
  const readMore = data.slug
    ? `<p><a href="${escapeHTML(buildAnnouncementUrl(data.slug))}">Read more →</a></p>`
    : ''

  return `${prefix}<h2>${title}</h2><p>${body}</p>${links}${readMore}`
}

export function formatTelegramHtml(data: AnnouncementData, isUpdate: boolean): string {
  const prefix = isUpdate ? '<b>UPDATED:</b>\n' : ''
  const title = `<b>${escapeHTML(data.title || 'Announcement')}</b>`
  const body = escapeHTML(data.body || '')
  const links = renderLinks(data.links, false)
  const readMore = data.slug
    ? `\n<a href="${escapeHTML(buildAnnouncementUrl(data.slug))}">Read more →</a>`
    : ''

  return `${prefix}${title}\n\n${body}${links ? `\n\n${links}` : ''}${readMore}`
}

export async function appendLog(
  client: SanityClient,
  docId: string,
  entry: {channel: string; status: string; details: string},
): Promise<void> {
  await client
    .patch(docId)
    .setIfMissing({distributionLog: []})
    .append('distributionLog', [
      {
        _type: 'logEntry',
        channel: entry.channel,
        sentAt: new Date().toISOString(),
        status: entry.status,
        details: entry.details,
      },
    ])
    .commit()
}
