import {ImageResponse} from '@vercel/og'
import type {NextRequest} from 'next/server'
import {client} from '@/sanity/client'
import {SESSION_DETAIL_QUERY, SPEAKER_DETAIL_QUERY, CONFERENCE_QUERY} from '@repo/sanity-queries'
import {urlForImage} from '@/sanity/image'

export const runtime = 'edge'

const WIDTH = 1200
const HEIGHT = 630

export async function GET(request: NextRequest) {
  const {searchParams} = request.nextUrl
  const type = searchParams.get('type')
  const slug = searchParams.get('slug')

  try {
    if (type === 'session' && slug) {
      return await sessionCard(slug)
    }
    if (type === 'speaker' && slug) {
      return await speakerCard(slug)
    }
    return await defaultCard()
  } catch {
    return await defaultCard()
  }
}

async function sessionCard(slug: string) {
  const [session, conference] = await Promise.all([
    client.fetch(SESSION_DETAIL_QUERY, {slug}),
    client.fetch(CONFERENCE_QUERY),
  ])

  if (!session) return defaultCard()

  const speakerNames = session.speakers?.map((s) => s.name).filter(Boolean) ?? []
  const speakerPhotos =
    session.speakers
      ?.map((s) => {
        const url = urlForImage(s.photo)
        return url ? url.width(96).height(96).fit('crop').url() : null
      })
      .filter(Boolean) ?? []

  const startTime = session.slot?.startTime
    ? new Date(session.slot.startTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York',
      })
    : null

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0a',
          color: '#fafafa',
          padding: '48px 56px',
        }}
      >
        {/* Top row: conference name + track badge */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <span style={{fontSize: 24, color: '#a1a1aa'}}>
            {conference?.name ?? 'Everything NYC 2026'}
          </span>
          {session.track?.name && (
            <span
              style={{
                fontSize: 20,
                color: '#d4d4d8',
                border: '2px solid #3f3f46',
                borderRadius: 9999,
                padding: '6px 20px',
              }}
            >
              {session.track.name}
            </span>
          )}
        </div>

        {/* Session type badge */}
        {session.sessionType && (
          <div style={{display: 'flex', marginTop: 24}}>
            <span
              style={{
                fontSize: 18,
                color: '#a1a1aa',
                backgroundColor: '#27272a',
                borderRadius: 9999,
                padding: '4px 16px',
              }}
            >
              {session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)}
            </span>
          </div>
        )}

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            marginTop: 16,
          }}
        >
          <span
            style={{
              fontSize: session.title && session.title.length > 50 ? 48 : 56,
              fontWeight: 700,
              lineHeight: 1.2,
              lineClamp: 3,
            }}
          >
            {session.title}
          </span>
        </div>

        {/* Bottom row: speaker photos + names, time + room */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'auto',
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            {speakerPhotos.slice(0, 4).map((url, i) => (
              <img
                key={i}
                src={url!}
                width={48}
                height={48}
                style={{borderRadius: '50%', objectFit: 'cover'}}
              />
            ))}
            {speakerNames.length > 0 && (
              <span style={{fontSize: 22, color: '#d4d4d8'}}>
                {speakerNames.slice(0, 3).join(', ')}
                {speakerNames.length > 3 && ` +${speakerNames.length - 3}`}
              </span>
            )}
          </div>
          {(startTime || session.slot?.room?.name) && (
            <span style={{fontSize: 20, color: '#a1a1aa'}}>
              {[startTime, session.slot?.room?.name].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </div>
    ),
    {width: WIDTH, height: HEIGHT},
  )
}

async function speakerCard(slug: string) {
  const [speaker, conference] = await Promise.all([
    client.fetch(SPEAKER_DETAIL_QUERY, {slug}),
    client.fetch(CONFERENCE_QUERY),
  ])

  if (!speaker) return defaultCard()

  const photoUrl = urlForImage(speaker.photo)
    ? urlForImage(speaker.photo)!.width(280).height(280).fit('crop').url()
    : null

  const sessionTitles =
    speaker.sessions?.map((s) => s.title).filter(Boolean).slice(0, 3) ?? []

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          backgroundColor: '#0a0a0a',
          color: '#fafafa',
          padding: '48px 56px',
        }}
      >
        {/* Left: Photo */}
        {photoUrl && (
          <div style={{display: 'flex', marginRight: 48, flexShrink: 0}}>
            <img
              src={photoUrl}
              width={240}
              height={240}
              style={{borderRadius: 16, objectFit: 'cover'}}
            />
          </div>
        )}

        {/* Right: Info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <span style={{fontSize: 20, color: '#a1a1aa'}}>
            {conference?.name ?? 'Everything NYC 2026'}
          </span>
          <span style={{fontSize: 48, fontWeight: 700, marginTop: 12, lineHeight: 1.2}}>
            {speaker.name}
          </span>
          {(speaker.role || speaker.company) && (
            <span style={{fontSize: 24, color: '#a1a1aa', marginTop: 8}}>
              {[speaker.role, speaker.company].filter(Boolean).join(' at ')}
            </span>
          )}

          {sessionTitles.length > 0 && (
            <div style={{display: 'flex', flexDirection: 'column', marginTop: 24, gap: 8}}>
              <span style={{fontSize: 16, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1}}>
                Speaking about
              </span>
              {sessionTitles.map((title, i) => (
                <span key={i} style={{fontSize: 22, color: '#d4d4d8', lineClamp: 1}}>
                  {title}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    {width: WIDTH, height: HEIGHT},
  )
}

async function defaultCard() {
  const conference = await client.fetch(CONFERENCE_QUERY)

  const startDate = conference?.startDate
    ? new Date(conference.startDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/New_York',
      })
    : null

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0a0a0a',
          color: '#fafafa',
        }}
      >
        <span style={{fontSize: 64, fontWeight: 700}}>
          {conference?.name ?? 'Everything NYC 2026'}
        </span>
        {conference?.tagline && (
          <span style={{fontSize: 28, color: '#a1a1aa', marginTop: 16}}>
            {conference.tagline}
          </span>
        )}
        {(startDate || conference?.venue?.name) && (
          <span style={{fontSize: 24, color: '#71717a', marginTop: 24}}>
            {[startDate, conference?.venue?.name].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>
    ),
    {width: WIDTH, height: HEIGHT},
  )
}
