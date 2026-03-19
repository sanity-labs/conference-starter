import type {DefaultDocumentNodeResolver, StructureResolver} from 'sanity/structure'
import {
  CalendarIcon,
  UserIcon,
  PresentationIcon,
  TagIcon,
  PinIcon,
  ClockIcon,
  StarIcon,
  DocumentIcon,
  BellIcon,
  EnvelopeIcon,
  ComposeIcon,
  ActivityIcon,
  RobotIcon,
  CommentIcon,
  HelpCircleIcon,
} from '@sanity/icons'
import {AGENT_CONTEXT_SCHEMA_TYPE_NAME} from '@sanity/agent-context/studio'
import {EmailPreview} from './components/EmailPreview'
import {OgPreview} from './components/OgPreview'

const OG_PREVIEW_TYPES: Record<string, 'session' | 'speaker' | 'page' | 'conference'> = {
  session: 'session',
  person: 'speaker',
  page: 'page',
  conference: 'conference',
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Everything NYC 2026')
    .items([
      // Conference settings — singleton
      S.listItem()
        .title('Conference')
        .icon(CalendarIcon)
        .child(S.document().schemaType('conference').documentId('conference')),

      S.divider(),

      // People (speakers, organizers) with status filtering
      S.listItem()
        .title('People')
        .icon(UserIcon)
        .child(
          S.list()
            .title('People')
            .items([
              S.listItem()
                .title('All People')
                .icon(UserIcon)
                .child(S.documentTypeList('person').title('All People')),
              S.divider(),
              S.listItem()
                .title('Travel: Booked')
                .child(
                  S.documentList()
                    .title('Travel Booked')
                    .filter('_type == "person" && travelStatus == "booked"'),
                ),
              S.listItem()
                .title('Travel: In Progress')
                .child(
                  S.documentList()
                    .title('Travel In Progress')
                    .filter('_type == "person" && travelStatus == "in-progress"'),
                ),
              S.listItem()
                .title('Travel: Not Started')
                .child(
                  S.documentList()
                    .title('Travel Not Started')
                    .filter(
                      '_type == "person" && (travelStatus == "not-started" || !defined(travelStatus))',
                    ),
                ),
              S.listItem()
                .title('Local (No Travel)')
                .child(
                  S.documentList()
                    .title('Local People')
                    .filter('_type == "person" && travelStatus == "local"'),
                ),
            ]),
        ),

      // Sessions grouped by type
      S.listItem()
        .title('Sessions')
        .icon(PresentationIcon)
        .child(
          S.list()
            .title('Sessions')
            .items([
              S.listItem()
                .title('All Sessions')
                .icon(PresentationIcon)
                .child(S.documentTypeList('session').title('All Sessions')),
              S.divider(),
              ...['keynote', 'talk', 'panel', 'workshop', 'lightning', 'break', 'social'].map(
                (type) =>
                  S.listItem()
                    .title(type.charAt(0).toUpperCase() + type.slice(1) + 's')
                    .child(
                      S.documentList()
                        .title(`${type.charAt(0).toUpperCase() + type.slice(1)}s`)
                        .filter('_type == "session" && sessionType == $type')
                        .params({type}),
                    ),
              ),
            ]),
        ),

      // Tracks
      S.listItem()
        .title('Tracks')
        .icon(TagIcon)
        .child(S.documentTypeList('track').title('Tracks')),

      S.divider(),

      // Schedule
      S.listItem()
        .title('Schedule')
        .icon(ClockIcon)
        .child(
          S.documentTypeList('scheduleSlot')
            .title('Schedule Slots')
            .defaultOrdering([{field: 'startTime', direction: 'asc'}]),
        ),

      // Venue & Rooms
      S.listItem()
        .title('Venue & Rooms')
        .icon(PinIcon)
        .child(
          S.list()
            .title('Venue & Rooms')
            .items([
              S.listItem()
                .title('Venues')
                .icon(PinIcon)
                .child(S.documentTypeList('venue').title('Venues')),
              S.listItem()
                .title('Rooms')
                .child(S.documentTypeList('room').title('Rooms')),
            ]),
        ),

      S.divider(),

      // Sponsors by tier
      S.listItem()
        .title('Sponsors')
        .icon(StarIcon)
        .child(
          S.list()
            .title('Sponsors')
            .items([
              S.listItem()
                .title('All Sponsors')
                .icon(StarIcon)
                .child(S.documentTypeList('sponsor').title('All Sponsors')),
              S.divider(),
              ...['platinum', 'gold', 'silver', 'bronze', 'community'].map((tier) =>
                S.listItem()
                  .title(tier.charAt(0).toUpperCase() + tier.slice(1))
                  .child(
                    S.documentList()
                      .title(`${tier.charAt(0).toUpperCase() + tier.slice(1)} Sponsors`)
                      .filter('_type == "sponsor" && tier == $tier')
                      .params({tier}),
                  ),
              ),
            ]),
        ),

      // CFP Submissions
      S.listItem()
        .title('CFP Submissions')
        .icon(EnvelopeIcon)
        .child(
          S.list()
            .title('CFP Submissions')
            .items([
              S.listItem()
                .title('All Submissions')
                .icon(EnvelopeIcon)
                .child(
                  S.documentTypeList('submission')
                    .title('All Submissions')
                    .defaultOrdering([{field: 'submittedAt', direction: 'desc'}]),
                ),
              S.divider(),
              ...['submitted', 'screening', 'scored', 'in-review', 'accepted', 'rejected'].map(
                (status) =>
                  S.listItem()
                    .title(status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '))
                    .child(
                      S.documentList()
                        .title(
                          `${status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')} Submissions`,
                        )
                        .filter('_type == "submission" && status == $status')
                        .params({status}),
                    ),
              ),
            ]),
        ),

      S.divider(),

      // Pages
      S.listItem()
        .title('Pages')
        .icon(DocumentIcon)
        .child(S.documentTypeList('page').title('Pages')),

      // Announcements with status filtering
      S.listItem()
        .title('Announcements')
        .icon(BellIcon)
        .child(
          S.list()
            .title('Announcements')
            .items([
              S.listItem()
                .title('All Announcements')
                .icon(BellIcon)
                .child(
                  S.documentTypeList('announcement')
                    .title('All Announcements')
                    .defaultOrdering([{field: 'publishedAt', direction: 'desc'}]),
                ),
              S.divider(),
              ...(['draft', 'ready', 'published'] as const).map((status) =>
                S.listItem()
                  .title(status.charAt(0).toUpperCase() + status.slice(1))
                  .child(
                    S.documentList()
                      .title(`${status.charAt(0).toUpperCase() + status.slice(1)} Announcements`)
                      .filter('_type == "announcement" && status == $status')
                      .params({status}),
                  ),
              ),
            ]),
        ),

      // FAQs
      S.listItem()
        .title('FAQs')
        .icon(HelpCircleIcon)
        .child(
          S.list()
            .title('FAQs')
            .items([
              S.listItem()
                .title('All FAQs')
                .icon(HelpCircleIcon)
                .child(S.documentTypeList('faq').title('All FAQs')),
              S.divider(),
              ...['general', 'venue', 'schedule', 'registration', 'accessibility', 'conduct', 'speakers'].map(
                (category) =>
                  S.listItem()
                    .title(category.charAt(0).toUpperCase() + category.slice(1))
                    .child(
                      S.documentList()
                        .title(`${category.charAt(0).toUpperCase() + category.slice(1)} FAQs`)
                        .filter('_type == "faq" && category == $category')
                        .params({category}),
                    ),
              ),
            ]),
        ),

      // Email Templates
      S.listItem()
        .title('Email Templates')
        .icon(ComposeIcon)
        .child(
          S.list()
            .title('Email Templates')
            .items([
              S.listItem()
                .title('All Templates')
                .icon(ComposeIcon)
                .child(S.documentTypeList('emailTemplate').title('All Templates')),
              S.divider(),
              ...['active', 'draft', 'archived'].map((status) =>
                S.listItem()
                  .title(status.charAt(0).toUpperCase() + status.slice(1))
                  .child(
                    S.documentList()
                      .title(`${status.charAt(0).toUpperCase() + status.slice(1)} Templates`)
                      .filter('_type == "emailTemplate" && status == $status')
                      .params({status}),
                  ),
              ),
            ]),
        ),

      // Logs
      S.listItem()
        .title('Email Logs')
        .icon(ActivityIcon)
        .child(
          S.documentTypeList('emailLog')
            .title('Email Logs')
            .defaultOrdering([{field: 'sentAt', direction: 'desc'}]),
        ),

      S.divider(),

      // AI Prompts
      S.listItem()
        .title('AI Prompts')
        .icon(RobotIcon)
        .child(
          S.list()
            .title('AI Prompts')
            .items([
              S.listItem()
                .title('CFP Screening')
                .icon(RobotIcon)
                .child(S.document().schemaType('prompt').documentId('prompt.cfpScreening')),
              S.listItem()
                .title('Telegram Ops Bot')
                .icon(RobotIcon)
                .child(S.document().schemaType('prompt').documentId('prompt.botOps')),
              S.listItem()
                .title('Telegram Attendee Bot')
                .icon(RobotIcon)
                .child(S.document().schemaType('prompt').documentId('prompt.botAttendee')),
            ]),
        ),

      // Agent Context
      S.listItem()
        .title('Agent Context')
        .icon(RobotIcon)
        .child(S.documentTypeList(AGENT_CONTEXT_SCHEMA_TYPE_NAME).title('Agent Context')),

      // Conversations (bot)
      S.listItem()
        .title('Conversations')
        .icon(CommentIcon)
        .child(
          S.documentTypeList('agent.conversation')
            .title('Conversations')
            .defaultOrdering([{field: '_createdAt', direction: 'desc'}]),
        ),
    ])

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'emailTemplate') {
    return S.document().views([
      S.view.form(),
      S.view.component(EmailPreview).title('Email Preview'),
    ])
  }

  const ogType = OG_PREVIEW_TYPES[schemaType]
  if (ogType) {
    return S.document().views([
      S.view.form(),
      S.view.component(OgPreview).options({type: ogType}).title('Social Preview'),
    ])
  }

  return S.document()
}
