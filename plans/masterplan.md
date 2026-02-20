# The Complete Conference/Event Backend

## Vision

A **reference architecture** that shows how Sanity can power every aspect of running a conference — from the first CFP to the post-event follow-up. Not just a website with a CMS behind it, but a true **content operating system** for events, where structured content drives the site, emails, schedules, sponsor fulfillment, and AI-powered attendee experiences.

This is a showcase for what Sanity can do when you go all-in: Content Lake as the single source of truth, Functions for automation, Content Agent for AI-powered content ops, Studio as the organizer's command center, App SDK for custom dashboards, and Visual Editing for the marketing site.

---

## Jobs to Be Done

A conference organizer needs to:

### 1. Programming & Schedule
- Define tracks (e.g., "Engineering", "Design", "Product")
- Create time slots across multiple days
- Assign talks to tracks and slots
- Handle schedule changes gracefully (notify affected attendees)
- Support different session types: keynotes, talks, workshops, lightning talks, panels, breaks

### 2. Speaker Management
- Collect speaker proposals (CFP)
- Review and accept/reject proposals
- Manage speaker profiles (bio, photo, social links, company)
- Coordinate speaker logistics (travel, hotel, AV needs)
- Generate speaker pages for the website

### 3. Attendee Experience
- Registration and ticketing (integrate with Tito, Luma, or Eventbrite)
- Personal schedule builder ("My Schedule")
- Real-time schedule updates
- Venue maps and wayfinding
- Post-event access to recordings and slides

### 4. Sponsor Management
- Sponsor tiers (Platinum, Gold, Silver, etc.)
- Sponsor profiles and logos
- Sponsor booth assignments
- Sponsor perks tracking (talk slots, logo placement, email mentions)
- Lead retrieval / sponsor ROI

### 5. Email Communications
- Attendee confirmation and welcome emails
- Speaker acceptance/logistics emails
- Schedule change notifications
- Pre-event reminders (1 week, 1 day, morning-of)
- Post-event thank you + survey + recordings
- Sponsor communications

### 6. Content & Marketing
- Conference website (landing page, schedule, speakers, venue, sponsors)
- Blog posts / announcements
- Social media content generation
- SEO-optimized speaker and talk pages

### 7. Operations & Analytics
- Attendee count tracking
- Session capacity management
- Check-in / badge scanning
- Real-time attendance per session
- Post-event analytics dashboard

---

## Architecture

### Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| **Content** | Sanity Content Lake | Single source of truth for all event data |
| **CMS** | Sanity Studio | Organizer's editing interface |
| **Custom Apps** | Sanity App SDK | Dashboards (speaker review, schedule builder, analytics) |
| **Automation** | Sanity Functions | Event-driven workflows (email triggers, schedule sync, etc.) |
| **AI** | Sanity Content Agent + Agent Actions | Content generation, translation, speaker bio enhancement |
| **Frontend** | Next.js (App Router) | Conference website with Visual Editing |
| **Email** | Resend + React Email | Transactional and marketing emails |
| **Auth** | Sanity for content auth; external for attendee auth | - |
| **Search** | GROQ + Semantic Search | Schedule search, speaker discovery |
| **Media** | Sanity Media Library | Speaker photos, sponsor logos, venue images |
| **Scheduling** | Sanity Functions (scheduled) | Timed email sends, content releases |
| **Realtime** | Sanity Live Content API | Live schedule updates on the site |

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        SANITY PLATFORM                          │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Studio   │  │ App SDK  │  │  Canvas  │  │Media Library │   │
│  │(Organizer │  │(Schedule │  │(Blog     │  │(Speaker pics,│   │
│  │ editing)  │  │ Builder, │  │ posts,   │  │ sponsor      │   │
│  │          │  │ Speaker  │  │ announce-│  │ logos)       │   │
│  │          │  │ Review)  │  │ ments)   │  │              │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │             │                │           │
│  ┌────▼──────────────▼─────────────▼────────────────▼───────┐  │
│  │                    CONTENT LAKE                           │  │
│  │  speakers, talks, tracks, schedule, sponsors, attendees  │  │
│  │  emails, venues, announcements, pages                    │  │
│  └──────┬──────────────┬──────────────┬─────────────────────┘  │
│         │              │              │                         │
│  ┌──────▼──────┐ ┌─────▼──────┐ ┌────▼──────────┐             │
│  │  Functions  │ │  Content   │ │  Context for  │             │
│  │  (triggers, │ │  Agent     │ │  Agents (MCP) │             │
│  │  scheduled) │ │  (AI ops)  │ │               │             │
│  └──────┬──────┘ └────────────┘ └───────────────┘             │
│         │                                                      │
└─────────┼──────────────────────────────────────────────────────┘
          │
    ┌─────▼─────────────────────────────────┐
    │          INTEGRATIONS                  │
    │                                        │
    │  ┌────────┐ ┌──────┐ ┌─────────────┐  │
    │  │ Resend │ │ Tito │ │ Eventbrite  │  │
    │  │(email) │ │      │ │ / Luma      │  │
    │  └────────┘ └──────┘ └─────────────┘  │
    └───────────────────────────────────────┘
          │
    ┌─────▼─────────────────────────────────┐
    │         NEXT.JS FRONTEND               │
    │                                        │
    │  Conference Website                    │
    │  • Visual Editing enabled              │
    │  • Live content (real-time schedule)   │
    │  • ISR for static pages                │
    │  • Personal schedule (auth'd)          │
    └────────────────────────────────────────┘
```

---

## Content Model (Core Document Types)

### Event / Conference
The top-level container. Supports multi-event setups.
- `title`, `slug`, `description`, `dates`, `venue` (ref), `logo`, `theme`

### Speaker
- `name`, `slug`, `bio` (Portable Text), `photo`, `company`, `role`, `socialLinks[]`
- `talks[]` (refs to Talk), `status` (invited / confirmed / declined)
- `travelNeeds`, `dietaryRestrictions`, `shirtSize`

### Talk / Session
- `title`, `slug`, `abstract` (Portable Text), `speakers[]` (refs), `track` (ref)
- `sessionType` (keynote / talk / workshop / lightning / panel / break)
- `duration`, `level` (beginner / intermediate / advanced)
- `slides` (file), `recording` (url), `status` (proposed / accepted / scheduled / cancelled)

### Track
- `title`, `slug`, `color`, `description`, `icon`

### Schedule Slot
- `day` (date), `startTime`, `endTime`, `talk` (ref), `track` (ref), `room` (ref)
- This is the join table between talks, tracks, and time

### Venue
- `name`, `address`, `map` (image), `rooms[]` (embedded: name, capacity, floor, amenities)

### Sponsor
- `name`, `slug`, `logo`, `website`, `tier` (platinum / gold / silver / bronze / community)
- `description` (Portable Text), `boothNumber`, `perks[]`
- `contacts[]` (name, email, role)

### Email Template
- `name`, `slug`, `subject`, `body` (Portable Text), `trigger` (manual / automated)
- `audience` (all attendees / speakers / sponsors / specific track)
- `scheduledFor` (datetime), `status` (draft / scheduled / sent)

### Page (Marketing)
- `title`, `slug`, `sections[]` (modular page builder blocks)
- Hero, CTA, FAQ, testimonial, countdown, etc.

### Announcement
- `title`, `body` (Portable Text), `publishedAt`, `pinned`, `audience`

---

## Sanity Functions — Automation Layer

This is where the magic happens. Functions turn Sanity from a CMS into an event operations platform.

### Document Event Functions

| Function | Trigger | What It Does |
|----------|---------|--------------|
| `on-speaker-confirmed` | Speaker status → "confirmed" | Sends welcome email via Resend, creates speaker page draft |
| `on-talk-scheduled` | Talk status → "scheduled" | Updates schedule, notifies speaker of their slot |
| `on-schedule-change` | Schedule slot updated | Sends notification to affected attendees |
| `on-sponsor-created` | New sponsor published | Generates sponsor page, notifies sponsor team |
| `on-email-scheduled` | Email template status → "scheduled" | Queues email for sending at scheduled time |
| `on-talk-recording-added` | Talk recording field populated | Notifies attendees who bookmarked the talk |
| `generate-speaker-social` | Speaker confirmed | Uses Agent Actions to generate social media cards |
| `generate-seo-metadata` | Any page published | Uses Agent Actions to generate meta descriptions, OG tags |

### Scheduled Functions (Coming Soon)

| Function | Schedule | What It Does |
|----------|----------|--------------|
| `pre-event-reminders` | 7d, 1d, morning-of | Sends reminder emails with personalized schedule |
| `daily-digest` | Daily during event | Sends "today's highlights" email |
| `post-event-followup` | 1 day after event | Sends thank you + survey + early bird for next year |
| `cfp-deadline-reminder` | 1 week before CFP closes | Reminds potential speakers |
| `sync-ticket-data` | Every 15 min | Pulls latest registration data from ticketing platform |

### GROQ Delta Examples

```groq
// Trigger when a speaker is confirmed
_type == "speaker" && delta::changedAny(["status"])

// Trigger when a talk gets scheduled (assigned to a slot)
_type == "scheduleSlot" && delta::changedAny(["talk"])

// Trigger when recording is added to a talk
_type == "talk" && !defined(before().recording) && defined(after().recording)
```

---

## Content Agent & AI Features

### In-Studio AI (Content Agent)
- **Speaker bio enhancement:** "Make this bio more engaging while keeping it factual"
- **Talk abstract improvement:** "Improve this abstract for the conference website audience"
- **Translation:** Translate all content for multilingual conferences
- **Batch metadata:** Generate alt text for all speaker photos
- **Email drafting:** "Draft a reminder email for attendees in track X"

### Agent Actions (Programmatic AI)
- **Auto-generate FAQ** from talk abstracts when published
- **Generate social cards** text for each confirmed speaker
- **Create talk summaries** from full abstracts for schedule view
- **Translate sponsor descriptions** when new sponsor is added
- **Generate SEO metadata** for all public pages

### Context for Agents (MCP)
- Power an **AI concierge** on the conference site
- "What talks about React are on Day 2?"
- "Who's speaking about accessibility?"
- "What's happening in Room A at 2pm?"
- Uses GROQ + semantic search for accurate, grounded answers

---

## Studio Experience

### Custom Structure
```
📋 Dashboard (overview widget)
├── 📅 Schedule
│   ├── Day 1
│   ├── Day 2
│   └── Day 3
├── 🎤 Speakers
│   ├── Confirmed
│   ├── Pending
│   └── Declined
├── 💬 Talks
│   ├── By Track
│   ├── By Status
│   └── Unscheduled
├── 🏢 Sponsors
│   ├── By Tier
│   └── All
├── 📧 Emails
│   ├── Drafts
│   ├── Scheduled
│   └── Sent
├── 📄 Pages
├── 📢 Announcements
└── ⚙️ Settings
    ├── Event Details
    ├── Venue
    └── Tracks
```

### App SDK Custom Apps

1. **Schedule Builder** — Drag-and-drop grid for assigning talks to slots/tracks/rooms. Visual conflict detection.
2. **Speaker Review Board** — Kanban-style CFP review with voting, comments, and bulk accept/reject.
3. **Email Campaign Manager** — Preview emails with real data, select audience segments, schedule sends.
4. **Analytics Dashboard** — Registration trends, session popularity, sponsor engagement metrics.

---

## Next.js Frontend

### Pages

| Route | Description | Data Strategy |
|-------|-------------|---------------|
| `/` | Landing page | ISR + Visual Editing |
| `/schedule` | Full schedule grid | Live Content API (real-time) |
| `/schedule/[day]` | Day view | Live Content API |
| `/speakers` | Speaker grid | ISR |
| `/speakers/[slug]` | Speaker profile + talks | ISR |
| `/talks/[slug]` | Talk detail | ISR |
| `/sponsors` | Sponsor showcase | ISR |
| `/venue` | Venue info + maps | ISR |
| `/blog` | Announcements | ISR |
| `/blog/[slug]` | Blog post | ISR |
| `/my-schedule` | Personal schedule (auth'd) | Client-side + Live |
| `/cfp` | Call for proposals form | Static + API route |

### Key Frontend Features
- **Visual Editing** on all marketing pages — organizers click-to-edit directly
- **Live schedule** — changes in Studio appear instantly on the site
- **Responsive schedule grid** — works on mobile for on-site use
- **Dark/light mode** — conference branding support
- **PWA support** — installable for on-site attendees
- **Share cards** — OG images auto-generated per speaker/talk

---

## Email System (Resend + React Email)

### Email Templates (built with React Email)
1. **Registration Confirmation** — ticket details, add-to-calendar links
2. **Speaker Acceptance** — congratulations, next steps, logistics form link
3. **Speaker Logistics** — travel info, schedule, AV requirements
4. **Schedule Published** — full schedule with personal bookmarks
5. **Schedule Change** — what changed, updated slot info
6. **Pre-Event Reminder** (7d) — what to expect, venue info, schedule link
7. **Pre-Event Reminder** (1d) — tomorrow's highlights, logistics
8. **Morning-Of** — today's schedule, WiFi info, map
9. **Daily Digest** — today's highlights, what's coming up
10. **Post-Event Thank You** — survey link, recording access, early bird
11. **Recording Available** — link to talk recording for bookmarked sessions
12. **Sponsor Welcome** — onboarding info, booth details, perks summary

### How It Works
1. Email templates are **content in Sanity** (subject, body as Portable Text, audience rules)
2. Sanity Functions trigger on email status changes or schedules
3. Function renders React Email template with Sanity data
4. Sends via Resend API
5. Delivery status written back to Sanity for tracking

---

## Content Releases — Coordinated Publishing

Perfect for conference workflows:

- **"Schedule Reveal" Release** — All schedule slots, speaker assignments, and track info published simultaneously
- **"Speaker Wave 1" Release** — First batch of confirmed speakers go live together
- **"Sponsor Announcement" Release** — All sponsor pages and logo placements go live at once
- **"Post-Event" Release** — Recordings, slides, and thank-you content published together

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Content model design and schema implementation
- [ ] Sanity Studio setup with custom structure
- [ ] Next.js project scaffolding with Sanity integration
- [ ] Visual Editing configuration
- [ ] Basic pages: home, speakers, schedule, sponsors, venue

### Phase 2: Core Features (Week 3-4)
- [ ] Schedule grid component (multi-track, multi-day)
- [ ] Speaker profiles and talk detail pages
- [ ] Sponsor showcase with tier-based layout
- [ ] CFP submission form
- [ ] Live Content API integration for real-time schedule

### Phase 3: Automation (Week 5-6)
- [ ] Sanity Functions setup (Blueprints)
- [ ] Email system: Resend integration + React Email templates
- [ ] Automated email triggers (speaker confirmed, schedule change, etc.)
- [ ] Agent Actions for content generation (SEO, social cards, summaries)
- [ ] Content Releases workflow for coordinated publishing

### Phase 4: Advanced (Week 7-8)
- [ ] App SDK: Schedule Builder (drag-and-drop)
- [ ] App SDK: Speaker Review Board (CFP management)
- [ ] App SDK: Email Campaign Manager
- [ ] Personal schedule feature (My Schedule)
- [ ] AI Concierge (Context for Agents / MCP)

### Phase 5: Polish & Launch (Week 9-10)
- [ ] Analytics dashboard (App SDK)
- [ ] PWA support for on-site use
- [ ] Performance optimization (ISR tuning, image optimization)
- [ ] Accessibility audit
- [ ] Documentation and handoff

---

## What This Showcases About Sanity

| Sanity Capability | How It's Used |
|-------------------|---------------|
| **Content Lake** | Single source of truth for ALL event data — not just website content |
| **Studio** | Organizer's command center with custom structure |
| **App SDK** | Purpose-built tools (schedule builder, CFP review, email manager) |
| **Functions** | Event-driven automation replacing external services |
| **Scheduled Functions** | Timed operations (reminders, digests, syncs) |
| **Content Agent** | AI-powered content ops (bios, abstracts, translations) |
| **Agent Actions** | Programmatic AI (auto-generate FAQs, social cards, SEO) |
| **Context for Agents** | AI concierge with grounded, accurate answers |
| **Visual Editing** | Click-to-edit on the live conference site |
| **Content Releases** | Coordinated publishing (schedule reveal, speaker waves) |
| **Media Library** | Centralized speaker photos, sponsor logos, venue images |
| **Canvas** | Long-form blog posts and announcements |
| **GROQ** | Powerful queries for schedule filtering, speaker search |
| **Semantic Search** | "Find talks about accessibility" on the site |
| **Live Content API** | Real-time schedule updates during the event |
| **Portable Text** | Rich content for bios, abstracts, emails, pages |
| **Webhooks** | Integration with ticketing platforms |

---

## Open Questions

1. **Ticketing integration** — Build our own or integrate with Tito/Luma/Eventbrite? (Recommend: integrate, ticketing is a solved problem)
2. **Attendee auth** — How do attendees log in for "My Schedule"? (Options: magic link via Resend, OAuth, ticket-based)
3. **Multi-event support** — Should the model support multiple conferences from day one?
4. **Internationalization** — Is multilingual a requirement? (Content Agent makes this feasible)
5. **Scope for v1** — Should we build the full vision or start with a focused subset?
