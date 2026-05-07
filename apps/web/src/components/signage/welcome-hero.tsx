import {sanityFetch} from '@/sanity/live'
import {WELCOME_HERO_QUERY} from '@repo/sanity-queries'
import type {SIGNAGE_DISPLAY_QUERY_RESULT, WELCOME_HERO_QUERY_RESULT} from '@repo/sanity-queries'
import {urlForImage} from '@/sanity/image'
import {Stage} from './stage'
import {formatDateRange} from './conference-day'

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
  const sponsors = conference.sponsors ?? []

  return (
    <Stage
      conferenceName={conference.name}
      conferenceTagline={conference.venue?.name}
      showClock={display.showClock !== false}
      showConferenceBranding={display.showConferenceBranding !== false}
      hideChrome={hideChrome}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 'clamp(1rem, 3vmin, 3rem)',
          width: '100%',
          padding: 'clamp(1rem, 3vmin, 3rem)',
        }}
      >
        {dates && <p className="signage-eyebrow">{dates}</p>}
        <h1
          className="signage-title"
          style={{fontSize: 'clamp(3rem, 10vmin, 12rem)', letterSpacing: '-0.03em'}}
        >
          {conference.name}
        </h1>
        {conference.tagline && (
          <p
            className="signage-meta"
            style={{
              fontSize: 'clamp(1.25rem, 3.5vmin, 3.5rem)',
              maxWidth: '24em',
              textWrap: 'balance',
            }}
          >
            {conference.tagline}
          </p>
        )}
        {sponsors.length > 0 && (
          <div
            style={{
              marginTop: 'clamp(1rem, 3vmin, 3rem)',
              paddingTop: 'clamp(1rem, 3vmin, 3rem)',
              borderTop: '1px solid var(--color-border)',
              width: '100%',
              maxWidth: '90vmin',
            }}
          >
            <p
              className="signage-eyebrow"
              style={{fontSize: 'clamp(0.75rem, 1.4vmin, 1.25rem)'}}
            >
              In partnership with
            </p>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 'clamp(0.75rem, 2vmin, 2rem) 0 0',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 'clamp(1rem, 3vmin, 3rem)',
              }}
            >
              {sponsors.map((sponsor) => {
                const logoUrl =
                  urlForImage(sponsor.logo)?.width(600).height(200).fit('max').url() ?? null
                return (
                  <li
                    key={sponsor._id}
                    style={{
                      maxHeight: 'clamp(2rem, 6vmin, 6rem)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={sponsor.logo?.alt ?? sponsor.name ?? ''}
                        style={{
                          maxHeight: 'clamp(2rem, 6vmin, 6rem)',
                          maxWidth: 'clamp(8rem, 18vmin, 18rem)',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          opacity: 0.85,
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: 'clamp(1rem, 2vmin, 2rem)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {sponsor.name}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </Stage>
  )
}
