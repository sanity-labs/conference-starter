import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {colorInput} from '@sanity/color-input'
import {presentationTool} from 'sanity/presentation'
import {schemaTypes} from '@repo/sanity-schema'
import {structure, defaultDocumentNode} from './structure'
import {resolve} from './resolve'
import {acceptSubmission} from './actions/acceptSubmission'
import {rejectSubmission} from './actions/rejectSubmission'
import {rescreenSubmission} from './actions/rescreenSubmission'
import {sendTestEmail} from './actions/sendTestEmail'
import {agentContextPlugin} from '@sanity/agent-context/studio'
import {scheduleBuilder} from './tools/schedule-builder'

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
    scheduleBuilder(),
    agentContextPlugin(),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'submission') {
        return [...prev, acceptSubmission, rejectSubmission, rescreenSubmission]
      }
      if (context.schemaType === 'emailTemplate') {
        return [...prev, sendTestEmail]
      }
      return prev
    },
    newDocumentOptions: (prev) => prev.filter((item) => item.templateId !== 'prompt'),
  },
})
