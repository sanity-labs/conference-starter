/** Projected schedule slot from GROQ query */
export interface SlotData {
  _id: string
  startTime: string
  endTime: string
  isPlenary: boolean | null
  room: {
    _id: string
    name: string
    capacity: number | null
    floor: string | null
    order: number | null
  } | null
  session: SessionData | null
}

/** Projected session (used both in slots and unscheduled panel) */
export interface SessionData {
  _id: string
  title: string
  sessionType: string | null
  duration: number | null
  level: string | null
  track: {
    _id: string
    name: string
    color: {hex: string} | null
  } | null
  speakers: Array<{
    _id: string
    name: string
  }> | null
}

/** Projected room for grid columns */
export interface RoomData {
  _id: string
  name: string
  capacity: number | null
  floor: string | null
  order: number | null
}

/** Conference data for header */
export interface ConferenceData {
  _id: string
  name: string
  startDate: string | null
  endDate: string | null
}

/** Time interval on the grid */
export interface TimeInterval {
  /** ISO datetime string */
  start: string
  /** Display label, e.g. "9:00 AM" */
  label: string
  /** Row index (1-based for CSS Grid) */
  row: number
}
