import {defineArrayMember, defineField, defineType} from 'sanity'
import {CommentIcon} from '@sanity/icons'

export const agentConversation = defineType({
  name: 'agent.conversation',
  title: 'Conversation',
  type: 'document',
  description: 'A recorded conversation between a user and the AI bot.',
  icon: CommentIcon,
  readOnly: true,
  fields: [
    defineField({
      name: 'platform',
      type: 'string',
      description: 'Which messaging platform this conversation occurred on.',
      options: {list: ['telegram', 'whatsapp', 'web']},
    }),
    defineField({
      name: 'summary',
      type: 'text',
      description: 'Auto-generated summary (set by classification Function).',
    }),
    defineField({
      name: 'messages',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'role', type: 'string'}),
            defineField({name: 'content', type: 'text'}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'classification',
      type: 'object',
      description: 'Auto-generated scores from classification Function.',
      fields: [
        defineField({
          name: 'successRate',
          type: 'number',
          description: '0-100: Did the conversation achieve its goal?',
        }),
        defineField({
          name: 'agentConfusion',
          type: 'number',
          description: '0-100: How much did the agent struggle?',
        }),
        defineField({
          name: 'userConfusion',
          type: 'number',
          description: '0-100: How unclear was the user?',
        }),
      ],
    }),
    defineField({
      name: 'contentGap',
      type: 'text',
      description: 'Content the agent could not find in the Content Lake.',
    }),
  ],
  preview: {
    select: {title: 'summary', platform: 'platform'},
    prepare({title, platform}) {
      return {
        title: title || 'Unclassified conversation',
        subtitle: platform || 'unknown',
      }
    },
  },
})
