import {defineQuery} from 'groq'

export const SPEAKERS_QUERY = defineQuery(
  `*[_type == "person"] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    photo { ..., alt },
    role,
    company,
    "sessionCount": count(*[_type == "session" && references(^._id)])
  }`,
)

export const SPEAKER_DETAIL_QUERY = defineQuery(
  `*[_type == "person" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    photo { ..., alt },
    role,
    company,
    bio,
    twitter,
    github,
    linkedin,
    website,
    seoTitle,
    seoDescription,
    ogImage,
    "sessions": *[_type == "session" && references(^._id)] {
      _id,
      title,
      "slug": slug.current,
      sessionType,
      level,
      track->{ name, "slug": slug.current, color },
      "slot": *[_type == "scheduleSlot" && session._ref == ^._id][0] {
        startTime,
        endTime,
        room->{ name, "slug": slug.current }
      }
    }
  }`,
)

export const SPEAKER_SLUGS_QUERY = defineQuery(
  `*[_type == "person" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`,
)
