import {SITE_URL} from '@/lib/metadata'

export async function GET() {
  return Response.redirect(new URL('/sitemap.md', SITE_URL), 301)
}
