import {defineArrayMember, defineField, defineType} from 'sanity'
import {HelpCircleIcon} from '@sanity/icons'

export const faq = defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  description: 'A frequently asked question with answer and category.',
  icon: HelpCircleIcon,
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      description:
        'The question as attendees would ask it. Content Agent: use these Q&A pairs to answer attendee questions directly.',
      validation: (rule) => rule.required().error('A question is required'),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
      description:
        'The answer. Supports links, lists, and formatting. Keep it concise — 1-3 sentences is ideal.',
      validation: (rule) => rule.required().error('An answer is required'),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Used for grouping FAQs in the bot and on the website.',
      options: {
        list: [
          {title: 'General', value: 'general'},
          {title: 'Venue', value: 'venue'},
          {title: 'Schedule', value: 'schedule'},
          {title: 'Registration', value: 'registration'},
          {title: 'Accessibility', value: 'accessibility'},
          {title: 'Conduct', value: 'conduct'},
          {title: 'Speakers', value: 'speakers'},
        ],
      },
    }),
  ],
  preview: {
    select: {title: 'question', category: 'category'},
    prepare({title, category}) {
      return {
        title: title || 'Untitled FAQ',
        subtitle: category
          ? category.charAt(0).toUpperCase() + category.slice(1)
          : undefined,
      }
    },
  },
})
