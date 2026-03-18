import {defineQuery} from 'groq'

export const ANNOUNCEMENTS_QUERY = defineQuery(
  `*[_type == "announcement" && status == "published"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    body
  }`,
)

export const ANNOUNCEMENT_DETAIL_QUERY = defineQuery(
  `*[_type == "announcement" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    body,
    links[] {
      _type,
      label,
      url,
      reference-> {
        _type,
        "slug": slug.current,
        "name": coalesce(title, name)
      }
    }
  }`,
)

export const ANNOUNCEMENT_SLUGS_QUERY = defineQuery(
  `*[_type == "announcement" && status == "published" && defined(slug.current)]{ "slug": slug.current }`,
)
