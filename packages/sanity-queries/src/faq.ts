import {defineQuery} from 'groq'

export const FAQ_QUERY = defineQuery(
  `*[_type == "faq"] | order(category asc, question asc) {
    _id,
    question,
    answer,
    category
  }`,
)
