import {defineQuery} from 'groq'

export const ANNOUNCEMENTS_QUERY = defineQuery(
  `*[_type == "announcement"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    coverImage { ..., alt }
  }`,
)

export const ANNOUNCEMENT_DETAIL_QUERY = defineQuery(
  `*[_type == "announcement" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    body[] { ... },
    coverImage { ..., alt },
    seoTitle,
    seoDescription,
    ogImage
  }`,
)

export const ANNOUNCEMENT_SLUGS_QUERY = defineQuery(
  `*[_type == "announcement" && defined(slug.current)]{ "slug": slug.current }`,
)
