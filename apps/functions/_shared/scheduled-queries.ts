/**
 * GROQ queries used by scheduled functions (daily-digest, reminder-cron).
 * These live in functions/_shared rather than packages/sanity-queries
 * because they are function-internal and not consumed by the web app.
 */

/** Conference dates, name, and CFP config */
export const CONFERENCE_CONFIG_QUERY = /* groq */ `
  *[_type == "conference"][0] {
    _id,
    name,
    "slug": slug.current,
    startDate,
    endDate,
    cfpOpen,
    cfpDeadline
  }
`

/**
 * Schedule slots for a given day — lighter than SCHEDULE_DAY_QUERY
 * (no photos, no track colors, no capacity).
 * Parameters: $conferenceId, $dayStart, $dayEnd
 */
export const SCHEDULE_DIGEST_QUERY = /* groq */ `
  *[_type == "scheduleSlot"
    && conference._ref == $conferenceId
    && startTime >= $dayStart
    && startTime < $dayEnd
  ] | order(startTime asc) {
    startTime,
    endTime,
    isPlenary,
    room->{ name, floor },
    session->{
      title,
      "slug": slug.current,
      sessionType,
      speakers[]->{ name }
    }
  }
`

/**
 * Fetch an email template by slug.
 * Parameter: $slug
 */
export const EMAIL_TEMPLATE_BY_SLUG_QUERY = /* groq */ `
  *[_type == "emailTemplate" && slug.current == $slug && status == "active"][0] {
    _id,
    name,
    subject,
    body,
    audience,
    trigger
  }
`
