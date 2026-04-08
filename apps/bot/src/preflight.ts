import {config} from './config'
import {sanityClient} from './sanity-client'

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

async function checkPromptDocument(promptId: string, label: string): Promise<CheckResult> {
  try {
    const doc = await sanityClient.fetch<{instruction: string | null}>(
      `*[_id == $id][0]{ instruction }`,
      {id: promptId},
    )
    if (!doc) {
      return {
        name: label,
        ok: false,
        message: `Document "${promptId}" not found.\n  → Run: cd apps/studio && npx sanity exec ../../scripts/seed-prompts.ts --with-user-token`,
      }
    }
    if (!doc.instruction) {
      return {
        name: label,
        ok: false,
        message: `"${promptId}" exists but has no instruction text.`,
      }
    }
    return {name: label, ok: true, message: `${promptId} loaded`}
  } catch {
    return {name: label, ok: false, message: `Failed to query ${promptId}`}
  }
}

function checkAnthropicKeyFormat(): CheckResult {
  const key = config.anthropicApiKey
  if (!key.startsWith('sk-ant-')) {
    return {
      name: 'Anthropic API key format',
      ok: false,
      message: `Key should start with "sk-ant-". Check your ANTHROPIC_API_KEY.`,
    }
  }
  return {name: 'Anthropic API key format', ok: true, message: 'Format valid'}
}

async function checkAgentContextMcp(): Promise<CheckResult> {
  try {
    const res = await fetch(config.mcpUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.readToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({jsonrpc: '2.0', method: 'initialize', id: 1, params: {protocolVersion: '2024-11-05', capabilities: {}, clientInfo: {name: 'preflight', version: '1.0.0'}}}),
    })
    if (res.status === 401) {
      return {
        name: 'Agent Context MCP',
        ok: false,
        message: `401 Unauthorized. Check SANITY_API_READ_TOKEN — create a Viewer token at sanity.io/manage → Project → API → Tokens.`,
      }
    }
    if (res.status === 404) {
      return {
        name: 'Agent Context MCP',
        ok: false,
        message: `404 Not Found. Check SANITY_CONTEXT_MCP_URL — ensure the Agent Context document is published and the slug matches.`,
      }
    }
    if (!res.ok) {
      return {
        name: 'Agent Context MCP',
        ok: false,
        message: `HTTP ${res.status} from MCP endpoint.`,
      }
    }
    return {name: 'Agent Context MCP', ok: true, message: 'MCP endpoint reachable'}
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {name: 'Agent Context MCP', ok: false, message: `Connection failed: ${msg}`}
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

  // Sync checks
  results.push(checkTelegramTokenFormat())
  results.push(checkAnthropicKeyFormat())

  // Async checks in parallel
  const [tokenResult, opsPromptResult, attendeePromptResult, mcpResult] = await Promise.all([
    checkSanityToken(),
    checkPromptDocument('prompt.botOps', 'Ops bot prompt'),
    checkPromptDocument('prompt.botAttendee', 'Attendee bot prompt'),
    checkAgentContextMcp(),
  ])
  results.push(tokenResult, opsPromptResult, attendeePromptResult, mcpResult)

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
