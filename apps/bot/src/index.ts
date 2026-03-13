import {bot} from './bot.js'
import {runPreflight} from './preflight.js'

const isServerless = !!process.env.VERCEL

async function start() {
  // Preflight checks only in polling mode (local dev) — not serverless
  if (!isServerless) {
    await runPreflight()
  }

  await bot.initialize()
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
