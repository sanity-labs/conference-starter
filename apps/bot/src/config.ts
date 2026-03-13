import {z} from 'zod'

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  SANITY_PROJECT_ID: z.string().min(1),
  SANITY_DATASET: z.string().min(1),
  SANITY_ORG_ID: z.string().min(1),
  SANITY_API_TOKEN: z.string().min(1),
  SANITY_API_READ_TOKEN: z.string().min(1),
  SANITY_API_WRITE_TOKEN: z.string().min(1),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Missing environment variables:')
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

export const config = {
  telegramBotToken: parsed.data.TELEGRAM_BOT_TOKEN,
  sanityProjectId: parsed.data.SANITY_PROJECT_ID,
  sanityDataset: parsed.data.SANITY_DATASET,
  sanityOrgId: parsed.data.SANITY_ORG_ID,
  sanityToken: parsed.data.SANITY_API_TOKEN,
  sanityReadToken: parsed.data.SANITY_API_READ_TOKEN,
  sanityWriteToken: parsed.data.SANITY_API_WRITE_TOKEN,
}
