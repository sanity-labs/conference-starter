import {Chat} from 'chat'
import {createTelegramAdapter} from '@chat-adapter/telegram'
import {createMemoryState} from '@chat-adapter/state-memory'
import {config} from './config.js'
import {handleMessage} from './handler.js'
import {isAllowedOrganizer} from './security/allowlist.js'

const telegram = createTelegramAdapter({
  botToken: config.telegramBotToken,
  mode: 'auto',
})

export const bot = new Chat({
  userName: 'everything-nyc-bot',
  adapters: {telegram},
  state: createMemoryState(),
})

bot.onNewMention(async (thread, message) => {
  console.log(`[mention] from=${message.author.userId} text="${message.text}"`)
  if (!(await isAllowedOrganizer(message.author.userId))) {
    console.log(`[mention] denied — not in organizer allowlist`)
    await thread.post('This bot is restricted to conference organizers.')
    return
  }
  console.log(`[mention] authorized — subscribing to thread ${thread.id}`)
  await thread.subscribe()
  await handleMessage(thread, message)
})

bot.onSubscribedMessage(async (thread, message) => {
  console.log(`[message] thread=${thread.id} text="${message.text}"`)
  await handleMessage(thread, message)
})
