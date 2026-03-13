import {Chat} from 'chat'
import {createTelegramAdapter} from '@chat-adapter/telegram'
import {createMemoryState} from '@chat-adapter/state-memory'
import {config} from './config.js'
import {handleMessage} from './handler.js'
import {isAllowedOrganizer} from './security/allowlist.js'

const bot = new Chat({
  userName: 'everything-nyc-bot',
  adapters: {
    telegram: createTelegramAdapter({botToken: config.telegramBotToken}),
  },
  state: createMemoryState(),
})

bot.onNewMention(async (thread, message) => {
  if (!(await isAllowedOrganizer(message.author.userId))) {
    await thread.post('This bot is restricted to conference organizers.')
    return
  }
  await thread.subscribe()
  await handleMessage(thread, message)
})

bot.onSubscribedMessage(async (thread, message) => {
  await handleMessage(thread, message)
})

console.log('Everything NYC bot started')
