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
  ],
})
