import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {colorInput} from '@sanity/color-input'
import {presentationTool} from 'sanity/presentation'
import {schemaTypes} from '@repo/sanity-schema'
import {structure, defaultDocumentNode} from './structure'
import {resolve} from './resolve'

export default defineConfig({
  name: 'default',
  title: 'Everything NYC 2026',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET!,

  plugins: [
    structureTool({structure, defaultDocumentNode}),
    visionTool(),
    colorInput(),
    presentationTool({
      resolve,
      previewUrl: {
        previewMode: {
          enable: '/api/draft-mode/enable',
        },
      },
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
