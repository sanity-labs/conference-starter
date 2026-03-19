import {defineQuery} from 'groq'

export const SCHEDULE_DAY_QUERY = defineQuery(
  `*[_type == "scheduleSlot"
    && conference._ref == $conferenceId
    && startTime >= $dayStart
    && startTime < $dayEnd
  ] | order(startTime asc) {
    _id,
    startTime,
    endTime,
    isPlenary,
    room->{
      _id,
      name,
      "slug": slug.current,
      capacity,
      floor
    },
    session->{
      _id,
      title,
      "slug": slug.current,
      sessionType,
      level,
      duration,
      track->{
        _id,
        name,
        "slug": slug.current,
        color
      },
      speakers[]->{
        _id,
        name,
        "slug": slug.current,
        photo { ..., alt },
        role,
        company
      },
      moderator->{
        _id,
        name,
        "slug": slug.current
      }
    }
  }`,
)
