import {defineQuery} from 'groq'

export const PAGE_QUERY = defineQuery(
  `*[_type == "page" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    sections[] {
      _key,
      _type,
      _type == "hero" => {
        heading,
        subheading,
        backgroundImage { ..., alt },
        cta { label, linkType, style, externalUrl, internalLink->{ _type, "slug": slug.current } }
      },
      _type == "richText" => {
        heading,
        content[] { ... }
      },
      _type == "speakerGrid" => {
        heading,
        limit,
        speakers[]->{ _id, name, "slug": slug.current, role, photo { ..., alt } }
      },
      _type == "sponsorBar" => {
        heading,
        tiers
      },
      _type == "schedulePreview" => {
        heading,
        day,
        maxSlots
      },
      _type == "ctaBlock" => {
        heading,
        body,
        cta { label, linkType, style, externalUrl, internalLink->{ _type, "slug": slug.current } }
      },
      _type == "faqSection" => {
        heading,
        items[] { _key, question, answer }
      }
    },
    seoTitle,
    seoDescription,
    ogImage
  }`,
)

export const PAGE_SLUGS_QUERY = defineQuery(
  `*[_type == "page" && defined(slug.current)]{ "slug": slug.current }`,
)
