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
      room->{ name, "slug": slug.current, floor }
    }
  }`,
)

export const SESSIONS_SUMMARY_QUERY = defineQuery(
  `*[_type == "session" && defined(slug.current) && !(sessionType in ["break", "social"])] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    sessionType
  }`,
)

export const FEATURED_SESSIONS_QUERY = defineQuery(
  `*[_type == "session" && defined(slug.current) && !(sessionType in ["break", "social"])]
    | order(select(sessionType == "keynote" => 0, sessionType == "talk" => 1, 2) asc, title asc)
    [0...4] {
    _id,
    title,
    "slug": slug.current,
    sessionType,
    track->{ _id, name, "slug": slug.current, color },
    speakers[]->{
      _id,
      name,
      "slug": slug.current,
      photo { ..., alt }
    }
  }`,
)

export const SESSIONS_LISTING_QUERY = defineQuery(
  `*[_type == "session" && defined(slug.current) && !(sessionType in ["break", "social"])] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    sessionType,
    level,
    duration,
    track->{ _id, name, "slug": slug.current, color },
    speakers[]->{
      _id,
      name,
      "slug": slug.current,
      photo { ..., alt }
    },
    "slot": *[_type == "scheduleSlot" && session._ref == ^._id][0] {
      startTime,
      room->{ name, "slug": slug.current }
    }
  }`,
)

export const RELATED_SESSIONS_QUERY = defineQuery(
  `*[_type == "session"
    && defined(slug.current)
    && !(sessionType in ["break", "social"])
    && slug.current != $slug
  ]
  | score(text::semanticSimilarity($searchText))
  | order(_score desc) [0...4] {
    _id,
    title,
    "slug": slug.current,
    sessionType,
    track->{ _id, name, "slug": slug.current, color },
    speakers[]->{
      _id,
      name,
      "slug": slug.current,
      photo { ..., alt }
    }
  }`,
)

export const SESSION_SLUGS_QUERY = defineQuery(
  `*[_type == "session" && defined(slug.current) && !(sessionType in ["break", "social"])]{ "slug": slug.current, _updatedAt }`,
)
