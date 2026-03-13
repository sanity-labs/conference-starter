import {waitUntil} from '@vercel/functions'
import {bot} from '../../src/bot.js'

export async function POST(request: Request): Promise<Response> {
  console.log('[webhook] POST received')
  try {
    const response = await bot.webhooks.telegram(request, {waitUntil})
    console.log('[webhook] response returned')
    return response
  } catch (error) {
    console.error('[webhook] error:', error)
    return new Response('Internal Server Error', {status: 500})
  }
}
