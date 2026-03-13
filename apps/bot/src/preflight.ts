import {config} from './config.js'
import {sanityClient} from './sanity-client.js'

interface CheckResult {
  name: string
  ok: boolean
  message: string
}

async function checkSanityToken(): Promise<CheckResult> {
  try {
    // A simple authenticated request — if the token is wrong type, this fails
    await sanityClient.fetch('*[_id == "___nonexistent___"][0]')
    return {name: 'Sanity token', ok: true, message: 'Authenticated successfully'}
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const hint = msg.includes('SIO-401-ANF')
      ? '\n  → You may be using an org token instead of a project token.\n  → Create a project-level Editor token at sanity.io/manage → Project → API → Tokens.'
      : ''
    return {name: 'Sanity token', ok: false, message: `Auth failed: ${msg}${hint}`}
  }
}

async function checkBotOpsPrompt(): Promise<CheckResult> {
  try {
    const doc = await sanityClient.fetch<{instruction: string | null}>(
      `*[_id == "prompt.botOps"][0]{ instruction }`,
    )
    if (!doc) {
      return {
        name: 'Bot prompt',
        ok: false,
        message:
          'Document "prompt.botOps" not found.\n  → Run: cd apps/studio && npx sanity exec ../../scripts/seed-prompts.ts --with-user-token',
      }
    }
    if (!doc.instruction) {
      return {
        name: 'Bot prompt',
        ok: false,
        message: '"prompt.botOps" exists but has no instruction text.',
      }
    }
    return {name: 'Bot prompt', ok: true, message: 'prompt.botOps loaded'}
  } catch {
    return {name: 'Bot prompt', ok: false, message: 'Failed to query prompt document'}
  }
}

function checkTelegramTokenFormat(): CheckResult {
  const token = config.telegramBotToken
  // Telegram bot tokens follow the pattern: <bot-id>:<secret>
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) {
    const hint = token.includes('\n') || token.includes('\r')
      ? '\n  → Token contains a newline. If you piped with `echo`, use `printf "%s"` instead.'
      : ''
    return {
      name: 'Telegram token format',
      ok: false,
      message: `Token doesn't match expected format <id>:<secret>.${hint}`,
    }
  }
  return {name: 'Telegram token format', ok: true, message: 'Format valid'}
}

export async function runPreflight(): Promise<void> {
  console.log('\n--- Preflight checks ---\n')

  const results: CheckResult[] = []

  // Sync check
  results.push(checkTelegramTokenFormat())

  // Async checks in parallel
  const [tokenResult, promptResult] = await Promise.all([
    checkSanityToken(),
    checkBotOpsPrompt(),
  ])
  results.push(tokenResult, promptResult)

  let hasFailure = false
  for (const r of results) {
    const icon = r.ok ? '✓' : '✗'
    console.log(`  ${icon} ${r.name}: ${r.message}`)
    if (!r.ok) hasFailure = true
  }

  console.log('')

  if (hasFailure) {
    throw new Error('Preflight checks failed. Fix the issues above and restart.')
  }

  console.log('All checks passed.\n')
}
