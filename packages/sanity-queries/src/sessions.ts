import {defineQuery} from 'groq'

export const SESSION_DETAIL_QUERY = defineQuery(
  `*[_type == "session" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    sessionType,
    level,
    duration,
    abstract,
    track->{ _id, name, "slug": slug.current, color },
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
      "slug": slug.current,
      photo { ..., alt },
      role,
      company
    },
    capacity,
    prerequisites,
    materials[] { title, url, type },
    slidesUrl,
    recordingUrl,
    seoTitle,
    seoDescription,
    ogImage,
    "slot": *[_type == "scheduleSlot" && session._ref == ^._id][0] {
      startTime,
      endTime,
      room->{ name, floor }
    }
  }`,
)

export const SESSION_SLUGS_QUERY = defineQuery(
  `*[_type == "session" && defined(slug.current) && !(sessionType in ["break", "social"])]{ "slug": slug.current }`,
)
