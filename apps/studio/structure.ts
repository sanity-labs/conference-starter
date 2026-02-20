import type {StructureResolver} from 'sanity/structure'
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
} from '@sanity/icons'

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

      // Speakers with status filtering
      S.listItem()
        .title('Speakers')
        .icon(UserIcon)
        .child(
          S.list()
            .title('Speakers')
            .items([
              S.listItem()
                .title('All Speakers')
                .icon(UserIcon)
                .child(S.documentTypeList('speaker').title('All Speakers')),
              S.divider(),
              S.listItem()
                .title('Travel: Booked')
                .child(
                  S.documentList()
                    .title('Travel Booked')
                    .filter('_type == "speaker" && travelStatus == "booked"'),
                ),
              S.listItem()
                .title('Travel: In Progress')
                .child(
                  S.documentList()
                    .title('Travel In Progress')
                    .filter('_type == "speaker" && travelStatus == "in-progress"'),
                ),
              S.listItem()
                .title('Travel: Not Started')
                .child(
                  S.documentList()
                    .title('Travel Not Started')
                    .filter(
                      '_type == "speaker" && (travelStatus == "not-started" || !defined(travelStatus))',
                    ),
                ),
              S.listItem()
                .title('Local (No Travel)')
                .child(
                  S.documentList()
                    .title('Local Speakers')
                    .filter('_type == "speaker" && travelStatus == "local"'),
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

      // Pages
      S.listItem()
        .title('Pages')
        .icon(DocumentIcon)
        .child(S.documentTypeList('page').title('Pages')),

      // Announcements
      S.listItem()
        .title('Announcements')
        .icon(BellIcon)
        .child(
          S.documentTypeList('announcement')
            .title('Announcements')
            .defaultOrdering([{field: 'publishedAt', direction: 'desc'}]),
        ),

    ])
