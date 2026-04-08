import {createClient} from 'next-sanity'
import {token} from './token'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

if (!projectId || !dataset) {
  console.warn(
    '⚠ Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET — see apps/web/.env.example',
  )
}

export const client = createClient({
  projectId: projectId || 'not-configured',
  dataset: dataset || 'production',
  apiVersion: '2026-03-15',
  useCdn: true,
  token,
  stega: {
    studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333',
  },
})
