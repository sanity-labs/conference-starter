import {conference} from './documents/conference'
import {person} from './documents/person'
import {personInternal} from './documents/personInternal'
import {session} from './documents/session'
import {track} from './documents/track'
import {venue} from './documents/venue'
import {room} from './documents/room'
import {scheduleSlot} from './documents/scheduleSlot'
import {signageDisplay} from './documents/signageDisplay'
import {sponsor} from './documents/sponsor'
import {page} from './documents/page'
import {announcement} from './documents/announcement'
import {submission} from './documents/submission'
import {emailTemplate} from './documents/emailTemplate'
export {emailVariables} from './documents/emailTemplate'
import {emailLog} from './documents/emailLog'
import {reminderLog} from './documents/reminderLog'
import {prompt} from './documents/prompt'
import {faq} from './documents/faq'
import {chatState} from './documents/chatState'

import {cta} from './objects/cta'
import {hero} from './objects/hero'
import {richText} from './objects/richText'
import {speakerGrid} from './objects/speakerGrid'
import {sponsorBar} from './objects/sponsorBar'
import {schedulePreview} from './objects/schedulePreview'
import {ctaBlock} from './objects/ctaBlock'
import {faqSection} from './objects/faqSection'
import {navItem} from './objects/navItem'
import {scoringCriterion} from './objects/scoringCriterion'

export const schemaTypes = [
  // Documents
  conference,
  person,
  personInternal,
  session,
  track,
  venue,
  room,
  scheduleSlot,
  signageDisplay,
  sponsor,
  page,
  announcement,
  submission,
  emailTemplate,
  emailLog,
  reminderLog,
  prompt,
  faq,
  chatState,
  // Objects
  cta,
  hero,
  richText,
  speakerGrid,
  sponsorBar,
  schedulePreview,
  ctaBlock,
  faqSection,
  navItem,
  scoringCriterion,
]
