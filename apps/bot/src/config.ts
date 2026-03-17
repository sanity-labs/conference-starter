import { z } from "zod";

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  SANITY_PROJECT_ID: z.string().min(1),
  SANITY_DATASET: z.string().min(1),
  SANITY_ORG_ID: z.string().min(1),
  // Application key from contentAgent.applications() — identifies the Studio workspace
  SANITY_APP_KEY: z.string().min(1),
  // Project-level token (Editor role) from sanity.io/manage → Project → API → Tokens
  // Used for Content Agent API, GROQ queries, and mutations
  SANITY_API_TOKEN: z.string().min(1),
  // Anthropic API key for attendee bot (Sonnet 4.6)
  ANTHROPIC_API_KEY: z.string().min(1),
  // Agent Context MCP endpoint URL (from Agent Context document in Studio)
  SANITY_CONTEXT_MCP_URL: z.string().url(),
  // Read-only Sanity API token (Viewer role) for Agent Context MCP auth
  SANITY_API_READ_TOKEN: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
  throw new Error(`Missing environment variables:\n${missing}`)
}

export const config = {
  telegramBotToken: parsed.data.TELEGRAM_BOT_TOKEN,
  sanityProjectId: parsed.data.SANITY_PROJECT_ID,
  sanityDataset: parsed.data.SANITY_DATASET,
  sanityOrgId: parsed.data.SANITY_ORG_ID,
  sanityAppKey: parsed.data.SANITY_APP_KEY,
  sanityToken: parsed.data.SANITY_API_TOKEN,
  anthropicApiKey: parsed.data.ANTHROPIC_API_KEY,
  mcpUrl: parsed.data.SANITY_CONTEXT_MCP_URL,
  readToken: parsed.data.SANITY_API_READ_TOKEN,
}
