import {defineQuery} from 'groq'

export const CFP_CONFIG_QUERY = defineQuery(
  `*[_type == "conference"][0]{
    _id,
    name,
    cfpOpen,
    cfpDeadline,
    cfpGuidelines
  }`,
)

export const CONFERENCE_QUERY = defineQuery(
  `*[_type == "conference"][0]{
    _id,
    name,
    "slug": slug.current,
    tagline,
    description,
    startDate,
    endDate,
    venue->{
      _id,
      name,
      address
    },
    tracks[]->{
      _id,
      name,
      "slug": slug.current,
      color
    },
    logo { ..., alt },
    socialCard
  }`,
)
