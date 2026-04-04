import {defineQuery} from 'groq'

export const NAV_QUERY = defineQuery(
  `*[_type == "conference"][0]{
    name,
    tagline,
    logo { ..., alt },
    registrationUrl,
    registrationLabel,
    socialLinks,
    headerNav[] {
      _key, title, linkType,
      page->{ _type, title, "slug": slug.current },
      route, url
    },
    footerNav[] {
      _key, title, linkType,
      page->{ _type, title, "slug": slug.current },
      route, url
    }
  }`,
)
