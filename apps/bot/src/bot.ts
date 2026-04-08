import {Chat} from 'chat'
import {createTelegramAdapter} from '@chat-adapter/telegram'
import {config} from './config'
import {handleOpsMessage} from './handler'
import {handleAttendeeMessage} from './handler-attendee'
import {isAllowedOrganizer} from './security/allowlist'
import {sanityClient} from './sanity-client'
import {createSanityState} from './state/index'

const isServerless = !!process.env.VERCEL

const telegram = createTelegramAdapter({
  botToken: config.telegramBotToken,
  mode: isServerless ? 'webhook' : 'polling',
})

export const bot = new Chat({
  userName: 'everything-nyc-bot',
  adapters: {telegram},
  state: createSanityState(sanityClient),
  onLockConflict: 'force',
  streamingUpdateIntervalMs: 1000,
  fallbackStreamingPlaceholderText: null,
})

bot.onNewMention(async (thread, message) => {
  const userId = message.author.userId
  console.log(`[mention] from=${userId} text="${message.text}"`)

  await thread.subscribe()

  if (await isAllowedOrganizer(userId)) {
    console.log(`[mention] organizer — routing to ops handler`)
    await handleOpsMessage(thread, message)
  } else {
    console.log(`[mention] attendee — routing to attendee handler`)
    await handleAttendeeMessage(thread, message)
  }
})

bot.onSubscribedMessage(async (thread, message) => {
  const userId = message.author.userId
  console.log(`[message] thread=${thread.id} from=${userId} text="${message.text}"`)

  if (await isAllowedOrganizer(userId)) {
    await handleOpsMessage(thread, message)
  } else {
    await handleAttendeeMessage(thread, message)
  }
})
