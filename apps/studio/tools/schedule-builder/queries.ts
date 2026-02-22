export const SLOTS_QUERY = `*[_type == "scheduleSlot"
  && conference._ref == $conferenceId
  && startTime >= $dayStart && startTime < $dayEnd
] | order(startTime asc) {
  _id, startTime, endTime, isPlenary,
  room->{ _id, name, capacity, floor, order },
  session->{ _id, title, sessionType, duration, level,
    track->{ _id, name, color },
    speakers[]->{ _id, name }
  }
}`

export const UNSCHEDULED_QUERY = `*[_type == "session"
  && !(sessionType in ["break", "social"])
  && count(*[_type == "scheduleSlot" && session._ref == ^._id]) == 0
] | order(title asc) {
  _id, title, sessionType, duration, level,
  track->{ _id, name, color },
  speakers[]->{ _id, name }
}`

export const CONFERENCE_QUERY = `*[_type == "conference"][0]{ _id, name, startDate, endDate }`

export const ROOMS_QUERY = `*[_type == "room"] | order(order asc, name asc) {
  _id, name, capacity, floor, order
}`
