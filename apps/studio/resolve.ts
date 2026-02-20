import {defineLocations, type PresentationPluginOptions} from 'sanity/presentation'

export const resolve: PresentationPluginOptions['resolve'] = {
  locations: {
    conference: defineLocations({
      select: {title: 'name'},
      resolve: () => ({
        locations: [{title: 'Home', href: '/'}],
      }),
    }),
    speaker: defineLocations({
      select: {title: 'name', slug: 'slug.current'},
      resolve: (doc) => ({
        locations: [
          {title: doc?.title || 'Speaker', href: `/speakers/${doc?.slug}`},
          {title: 'All Speakers', href: '/speakers'},
        ],
      }),
    }),
    session: defineLocations({
      select: {title: 'title', slug: 'slug.current'},
      resolve: (doc) => ({
        locations: [
          {title: doc?.title || 'Session', href: `/sessions/${doc?.slug}`},
          {title: 'Schedule', href: '/schedule'},
        ],
      }),
    }),
    track: defineLocations({
      select: {title: 'name'},
      resolve: (doc) => ({
        locations: [{title: doc?.title || 'Track', href: '/schedule'}],
      }),
    }),
    venue: defineLocations({
      select: {title: 'name'},
      resolve: () => ({
        locations: [{title: 'Home (Venue)', href: '/'}],
      }),
    }),
    sponsor: defineLocations({
      select: {title: 'name'},
      resolve: () => ({
        locations: [{title: 'Home', href: '/'}],
      }),
    }),
    announcement: defineLocations({
      select: {title: 'title', slug: 'slug.current'},
      resolve: (doc) => ({
        locations: [{title: doc?.title || 'Announcement', href: `/`}],
      }),
    }),
  },
}
