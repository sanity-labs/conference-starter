import {defineQuery} from 'groq'

export const SPONSORS_QUERY = defineQuery(
  `*[_type == "sponsor"] | order(
    select(
      tier == "platinum" => 0,
      tier == "gold" => 1,
      tier == "silver" => 2,
      tier == "bronze" => 3,
      tier == "community" => 4,
      5
    ) asc,
    order asc,
    name asc
  ) {
    _id,
    name,
    "slug": slug.current,
    tier,
    logo { ..., alt },
    description,
    website
  }`,
)
