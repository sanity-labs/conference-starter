import {defineQuery} from 'groq'

export const NAV_QUERY = defineQuery(
  `*[_type == "conference"][0]{
    name,
    logo { ..., alt },
    registrationUrl,
    registrationLabel,
    socialLinks,
    "pages": *[_type == "page"] | order(title asc) { _id, title, "slug": slug.current }
  }`,
)
