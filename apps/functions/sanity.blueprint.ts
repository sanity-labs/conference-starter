import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'
// import {defineScheduleFunction} from '@sanity/blueprints' // TODO: Re-enable with org-scoped stack

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: 'screen-cfp',
      src: './screen-cfp',
      event: {
        on: ['create'],
        filter: '_type == "submission" && status == "submitted"',
        projection:
          '{_id, sessionTitle, sessionType, abstract, level, topics, submitterName, submitterEmail, bio, status, conference}',
        resource: {type: 'dataset', id: 'yjorde43.production'},
      },
      timeout: 60,
    }),
    defineDocumentFunction({
      name: 'send-cfp-confirmation',
      src: './send-cfp-confirmation',
      event: {
        on: ['create'],
        filter: '_type == "submission"',
        projection: '{_id, sessionTitle, submitterName, submitterEmail}',
        resource: {type: 'dataset', id: 'yjorde43.production'},
      },
      timeout: 30,
    }),
    defineDocumentFunction({
      name: 'send-status-email',
      src: './send-status-email',
      event: {
        on: ['update'],
        filter: '_type == "submission" && delta::changedAny(status)',
        projection: '{_id, sessionTitle, submitterName, submitterEmail, status}',
        resource: {type: 'dataset', id: 'yjorde43.production'},
      },
      timeout: 30,
    }),
    defineDocumentFunction({
      name: 'rescreen-cfp',
      src: './rescreen-cfp',
      event: {
        on: ['update'],
        filter:
          '_type == "submission" && delta::changedAny(status) && after().status == "screening"',
        projection:
          '{_id, sessionTitle, sessionType, abstract, level, topics, submitterName, submitterEmail, bio, status, conference}',
        resource: {type: 'dataset', id: 'yjorde43.production'},
      },
      timeout: 60,
    }),
    defineDocumentFunction({
      name: 'classify-conversation',
      src: './classify-conversation',
      event: {
        on: ['create', 'update'],
        filter:
          '_type == "agent.conversation" && (delta::changedAny(messages) || delta::operation() == "create") && defined(messages)',
        projection: '{_id, messages, summary}',
        resource: {type: 'dataset', id: 'yjorde43.production'},
      },
      timeout: 60,
    }),
    defineDocumentFunction({
      name: 'send-announcement-email',
      src: './send-announcement-email',
      event: {
        on: ['update'],
        filter:
          '_type == "announcement" && delta::changedAny(status) && after().status == "published"',
        projection:
          '{ _id, title, "slug": slug.current, body, "links": links[]{ _type, label, url, reference->{ _type, "slug": slug.current, "name": coalesce(title, name) } }, distributionLog }',
        resource: {type: 'dataset', id: 'yjorde43.production'},
      },
      timeout: 30,
    }),
    defineDocumentFunction({
      name: 'push-announcement-telegram',
      src: './push-announcement-telegram',
      event: {
        on: ['update'],
        filter:
          '_type == "announcement" && delta::changedAny(status) && after().status == "published"',
        projection:
          '{ _id, title, "slug": slug.current, body, "links": links[]{ _type, label, url, reference->{ _type, "slug": slug.current, "name": coalesce(title, name) } }, distributionLog }',
        resource: {type: 'dataset', id: 'yjorde43.production'},
      },
      timeout: 30,
    }),
    // ─── Person Internal Lifecycle ─────────────────────────────────────────
    defineDocumentFunction({
      name: 'create-person-internal',
      src: './create-person-internal',
      event: {
        on: ['create'],
        filter: '_type == "person" && _id match "drafts.*"',
        includeDrafts: true,
        projection: '{ _id }',
        resource: {type: 'dataset', id: 'yjorde43.production'},
      },
    }),
    defineDocumentFunction({
      name: 'delete-person-internal',
      src: './delete-person-internal',
      event: {
        on: ['delete'],
        filter: '_type == "person"',
        includeDrafts: true,
        projection: '{ _id }',
        resource: {type: 'dataset', id: 'yjorde43.production'},
      },
    }),
    // ─── Scheduled Functions ──────────────────────────────────────────────
    // TODO: Re-enable once stack is org-scoped (required for scheduled functions)
    // defineScheduleFunction({
    //   name: 'daily-digest',
    //   src: './daily-digest',
    //   event: {
    //     minute: '0',
    //     hour: '7',
    //     dayOfWeek: '*',
    //     month: '*',
    //     dayOfMonth: '*',
    //   },
    //   timezone: 'America/New_York',
    // }),
    // defineScheduleFunction({
    //   name: 'reminder-cron',
    //   src: './reminder-cron',
    //   event: {
    //     minute: '0',
    //     hour: '8',
    //     dayOfWeek: '*',
    //     month: '*',
    //     dayOfMonth: '*',
    //   },
    //   timezone: 'America/New_York',
    // }),
  ],
})
