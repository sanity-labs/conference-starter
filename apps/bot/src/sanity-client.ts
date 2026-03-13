import {createClient} from '@sanity/client'
import {config} from './config.js'

export const sanityClient = createClient({
  projectId: config.sanityProjectId,
  dataset: config.sanityDataset,
  apiVersion: '2026-01-01',
  useCdn: false,
  token: config.sanityToken,
})
