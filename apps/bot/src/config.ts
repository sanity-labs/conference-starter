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
}
