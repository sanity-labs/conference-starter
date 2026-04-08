import {createClient} from '@sanity/client'
import {config} from './config'

export const sanityClient = createClient({
  projectId: config.sanityProjectId,
  dataset: config.sanityDataset,
  apiVersion: '2026-03-15',
  useCdn: false,
  token: config.sanityToken,
})
