import {sanityFetch} from '@/sanity/live'
import {WELCOME_HERO_QUERY} from '@repo/sanity-queries'
import type {SIGNAGE_DISPLAY_QUERY_RESULT, WELCOME_HERO_QUERY_RESULT} from '@repo/sanity-queries'
import {urlForImage} from '@/sanity/image'
import {Stage} from './stage'
import {formatDateRange} from './conference-day'
import {SponsorSoup, type SponsorSoupItem} from './sponsor-soup'

type Display = NonNullable<SIGNAGE_DISPLAY_QUERY_RESULT>

export async function WelcomeHero({
  display,
  hideChrome,
}: {
  display: Display
  hideChrome: boolean
}) {
  const {data} = await sanityFetch({
    query: WELCOME_HERO_QUERY,
    perspective: 'published',
    stega: false,
  })

  const conference = data as NonNullable<WELCOME_HERO_QUERY_RESULT> | null

  if (!conference) {
    return (
      <Stage hideChrome={hideChrome}>
        <p className="signage-meta">No conference configured.</p>
      </Stage>
    )
  }

  const dates = formatDateRange(conference.startDate, conference.endDate)
  const sponsors = (conference.sponsors ?? []).slice(0, 12)

  return (
    <Stage
      conferenceName={conference.name}
      conferenceTagline={conference.venue?.name}
      showClock={display.showClock !== false}
      showConferenceBranding={display.showConferenceBranding !== false}
      hideChrome={hideChrome}
    >
      <div className="signage-grid" style={{alignContent: 'center'}}>
        <div
          style={{
            gridColumn: '3 / -3',
            display: 'grid',
            gap: 'clamp(0.75rem, 2vmin, 2.5rem)',
            justifyItems: 'center',
            textAlign: 'center',
          }}
        >
          {dates && (
            <p className="signage-eyebrow signage-time">{dates}</p>
          )}
          <h1
            className="signage-title"
            style={{
              fontSize: 'clamp(3rem, 10vmin, 12rem)',
              letterSpacing: '-0.03em',
              maxWidth: '20ch',
            }}
          >
            {conference.name}
          </h1>
          {conference.tagline && (
            <p
              className="signage-meta"
              style={{
                fontSize: 'clamp(1.25rem, 3.5vmin, 3.5rem)',
                maxWidth: '32ch',
              }}
            >
              {conference.tagline}
            </p>
          )}
          {sponsors.length > 0 && <SponsorCloud sponsors={sponsors} />}
        </div>
      </div>
    </Stage>
  )
}

function SponsorCloud({
  sponsors,
}: {
  sponsors: NonNullable<NonNullable<WELCOME_HERO_QUERY_RESULT>['sponsors']>
}) {
  // Split into logo'd vs text-only sponsors. Logo-soup normalises the
  // visual weight of the logo group; text-only names sit below as a
  // small acknowledgements line so we don't mix the two render modes.
  const withLogos: SponsorSoupItem[] = []
  const textOnly: string[] = []

  for (const sponsor of sponsors) {
    if (!sponsor.name) continue
    const url = urlForImage(sponsor.logo)?.width(800).height(400).fit('max').url() ?? null
    if (url) {
      withLogos.push({
        id: sponsor._id,
        name: sponsor.name,
        src: url,
        alt: sponsor.logo?.alt ?? sponsor.name,
      })
    } else {
      textOnly.push(sponsor.name)
    }
  }

  return (
    <div
      style={{
        marginTop: 'clamp(1rem, 3vmin, 3rem)',
        paddingTop: 'clamp(1rem, 3vmin, 3rem)',
        borderTop:
          '1px solid color-mix(in oklab, var(--color-text-primary) 12%, transparent)',
        width: '100%',
        maxWidth: '90vmin',
        display: 'grid',
        rowGap: 'clamp(1rem, 2vmin, 2rem)',
        justifyItems: 'center',
      }}
    >
      <p
        className="signage-eyebrow"
        style={{fontSize: 'clamp(0.75rem, 1.4vmin, 1.25rem)'}}
      >
        In partnership with
      </p>
      {withLogos.length > 0 && <SponsorSoup items={withLogos} baseSize={56} gap={48} />}
      {textOnly.length > 0 && (
        <p
          className="signage-meta"
          style={{
            fontSize: 'clamp(0.875rem, 1.6vmin, 1.5rem)',
            color: 'var(--color-text-muted)',
            maxWidth: '60ch',
            textAlign: 'center',
          }}
        >
          {textOnly.join(' · ')}
        </p>
      )}
    </div>
  )
}
