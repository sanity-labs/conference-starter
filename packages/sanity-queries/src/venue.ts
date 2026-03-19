import {defineQuery} from 'groq'

export const VENUE_QUERY = defineQuery(
  `*[_type == "conference"][0].venue->{
    _id,
    name,
    "slug": slug.current,
    address,
    description,
    mapUrl,
    transitInfo,
    wifiInfo,
    image { ..., alt },
    "rooms": *[_type == "room" && venue._ref == ^._id] | order(order asc, name asc) {
      _id,
      name,
      "slug": slug.current,
      floor,
      capacity,
      amenities,
      "schedule": *[_type == "scheduleSlot" && room._ref == ^._id] | order(startTime asc) {
        _id,
        startTime,
        endTime,
        session->{
          title,
          "slug": slug.current,
          sessionType
        }
      }
    }
  }`,
)
