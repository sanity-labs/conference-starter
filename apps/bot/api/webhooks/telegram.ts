import {waitUntil} from '@vercel/functions'
import {bot} from '../../src/bot.js'

export async function POST(request: Request): Promise<Response> {
  return bot.webhooks.telegram(request, {waitUntil})
}
