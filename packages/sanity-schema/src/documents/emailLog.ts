import {defineField, defineType} from 'sanity'
import {ActivityIcon} from '@sanity/icons'

export const emailLog = defineType({
  name: 'emailLog',
  title: 'Email Log',
  type: 'document',
  icon: ActivityIcon,
  readOnly: true,
  fields: [
    defineField({
      name: 'resendId',
      title: 'Resend Email ID',
      type: 'string',
      description: 'The unique email ID returned from Resend after sending.',
    }),
    defineField({
      name: 'template',
      title: 'Template',
      type: 'string',
      description: 'Which email template was used (e.g., "cfp-confirmation", "cfp-accepted").',
    }),
    defineField({
      name: 'to',
      title: 'Recipient',
      type: 'string',
      description: 'The email address the email was sent to.',
    }),
    defineField({
      name: 'subject',
      title: 'Subject',
      type: 'string',
    }),
    defineField({
      name: 'sentAt',
      title: 'Sent At',
      type: 'datetime',
    }),
    defineField({
      name: 'status',
      title: 'Delivery Status',
      type: 'string',
      options: {
        list: [
          {title: 'Sent', value: 'sent'},
          {title: 'Delivered', value: 'delivered'},
          {title: 'Bounced', value: 'bounced'},
          {title: 'Failed', value: 'failed'},
          {title: 'Complained', value: 'complained'},
        ],
      },
    }),
    defineField({
      name: 'relatedDocument',
      title: 'Related Document',
      type: 'reference',
      to: [{type: 'submission'}, {type: 'person'}],
      description: 'The submission or person that triggered this email.',
      weak: true,
    }),
  ],
  orderings: [
    {
      title: 'Newest First',
      name: 'sentAtDesc',
      by: [{field: 'sentAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'subject', to: 'to', status: 'status', sentAt: 'sentAt'},
    prepare({title, to, status, sentAt}) {
      const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'
      const dateLabel = sentAt ? new Date(sentAt as string).toLocaleString() : ''
      return {
        title: title || 'Untitled Email',
        subtitle: [to, statusLabel, dateLabel].filter(Boolean).join(' · '),
      }
    },
  },
})
