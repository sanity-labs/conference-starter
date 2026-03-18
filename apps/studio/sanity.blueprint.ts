import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: 'screen-cfp',
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
  ],
})
