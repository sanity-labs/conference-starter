import {defineField, defineType} from 'sanity'
import {RobotIcon} from '@sanity/icons'

export const prompt = defineType({
  name: 'prompt',
  title: 'AI Prompt',
  type: 'document',
  icon: RobotIcon,
  liveEdit: true,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Display name for this prompt, e.g., "CFP Screening".',
      validation: (rule) => rule.required().error('Title is required'),
    }),
    defineField({
      name: 'instruction',
      title: 'Instruction',
      type: 'text',
      rows: 20,
      description:
        'The AI instruction with $variable placeholders. Available variables for CFP screening: $title, $sessionType, $abstract, $bio, $criteria.',
      validation: (rule) =>
        rule.required().min(50).error('Instruction must be at least 50 characters'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Internal notes about what this prompt does and which variables it expects.',
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {
        title: title || 'Untitled Prompt',
        subtitle: 'AI Prompt',
      }
    },
  },
})
