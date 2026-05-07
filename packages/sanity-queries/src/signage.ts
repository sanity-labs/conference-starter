import {defineQuery} from 'groq'

export const SIGNAGE_DISPLAY_QUERY = defineQuery(
  `*[_type == "signageDisplay" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    kind,
    theme,
    orientation,
    dwellSeconds,
    transition,
    showClock,
    showConferenceBranding,
    announcementMode,
    "legacyShowAnnouncementOverlay": showAnnouncementOverlay,
    active,
    lookaheadMinutes,
    room->{
      _id,
      name,
      "slug": slug.current
    },
    rooms[]->{
      _id,
      name,
      "slug": slug.current
    }
  }`,
)

export const SIGNAGE_DISPLAYS_INDEX_QUERY = defineQuery(
  `*[_type == "signageDisplay"] | order(active desc, name asc) {
    _id,
    name,
    "slug": slug.current,
    kind,
    active,
    room->{name},
    notes
  }`,
)

const SLOT_PROJECTION = `{
  _id,
  startTime,
  endTime,
  isPlenary,
  room->{
    _id,
    name,
    "slug": slug.current,
    capacity,
    floor
  },
  session->{
    _id,
    title,
    "slug": slug.current,
    sessionType,
    level,
    duration,
    track->{
      _id,
      name,
      "slug": slug.current,
      color
    },
    speakers[]->{
      _id,
      name,
      "slug": slug.current,
      photo { ..., alt },
      role,
      company
    },
    moderator->{
      _id,
      name,
      "slug": slug.current
    }
  }
}`

export const ROOM_DAY_SLOTS_QUERY = defineQuery(
  `*[_type == "scheduleSlot"
    && room._ref == $roomId
    && startTime >= $dayStart
    && startTime < $dayEnd
  ] | order(startTime asc) ${SLOT_PROJECTION}`,
)

export const MULTI_ROOM_DAY_SLOTS_QUERY = defineQuery(
  `*[_type == "scheduleSlot"
    && (count($roomIds) == 0 || room._ref in $roomIds)
    && startTime >= $dayStart
    && startTime < $dayEnd
  ] | order(startTime asc) ${SLOT_PROJECTION}`,
)

export const UPCOMING_SPEAKERS_QUERY = defineQuery(
  `*[_type == "scheduleSlot"
    && startTime >= $now
    && startTime < $cutoff
    && defined(session->speakers)
    && count(session->speakers) > 0
  ] | order(startTime asc) {
    _id,
    startTime,
    endTime,
    room->{
      _id,
      name,
      "slug": slug.current
    },
    session->{
      _id,
      title,
      "slug": slug.current,
      sessionType,
      track->{name, color},
      speakers[]->{
        _id,
        name,
        "slug": slug.current,
        photo { ..., alt },
        role,
        company
      }
    }
  }`,
)

export const SIGNAGE_SPONSORS_QUERY = defineQuery(
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
    tier,
    logo { ..., alt },
    website
  }`,
)

export const WELCOME_HERO_QUERY = defineQuery(
  `*[_type == "conference"][0] {
    _id,
    name,
    tagline,
    description,
    startDate,
    endDate,
    logo { ..., alt },
    venue->{name, address},
    "sponsors": *[_type == "sponsor"] | order(
      select(
        tier == "platinum" => 0,
        tier == "gold" => 1,
        tier == "silver" => 2,
        tier == "bronze" => 3,
        tier == "community" => 4,
        5
      ) asc,
      order asc
    )[0...12] {
      _id,
      name,
      tier,
      logo { ..., alt }
    }
  }`,
)

export const ACTIVE_ANNOUNCEMENT_OVERLAY_QUERY = defineQuery(
  `*[_type == "announcement"
    && status == "published"
    && coalesce(signageOverlay, false) == true
  ] | order(coalesce(publishedAt, _updatedAt) desc) [0...3] {
    _id,
    title,
    body,
    publishedAt,
    _updatedAt,
    signageOverlayDurationSeconds
  }`,
)
