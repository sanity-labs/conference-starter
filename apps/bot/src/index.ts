import {bot} from './bot.js'

// In polling mode (local dev), initialize starts the poll loop.
// In webhook mode (production), the Chat instance initializes lazily on first webhook.
void bot.initialize()
