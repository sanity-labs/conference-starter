import {defineField, defineType} from 'sanity'

export const scoringCriterion = defineType({
  name: 'scoringCriterion',
  title: 'Scoring Criterion',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'The criterion label (e.g., "Topic Relevance", "Speaker Expertise").',
      validation: (rule) => rule.required().error('Give this criterion a name'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description:
        'Explain what this criterion evaluates. The AI screener uses this to understand how to score submissions.',
    }),
    defineField({
      name: 'weight',
      title: 'Weight (%)',
      type: 'number',
      description: 'Relative weight of this criterion in the overall score. All weights should sum to 100.',
      validation: (rule) => rule.required().min(1).max(100),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      weight: 'weight',
    },
    prepare({title, weight}) {
      return {
        title: title || 'Untitled criterion',
        subtitle: weight ? `Weight: ${weight}%` : undefined,
      }
    },
  },
})
