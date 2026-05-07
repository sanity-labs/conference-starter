import {Clock} from './clock'

type StageProps = {
  conferenceName?: string | null
  conferenceTagline?: string | null
  showClock?: boolean
  showConferenceBranding?: boolean
  hideChrome?: boolean
  eyebrow?: string | null
  footnote?: string | null
  children: React.ReactNode
}

export function Stage({
  conferenceName,
  conferenceTagline,
  showClock = true,
  showConferenceBranding = true,
  hideChrome = false,
  eyebrow,
  footnote,
  children,
}: StageProps) {
  const showHeader =
    !hideChrome && (showConferenceBranding || showClock || Boolean(eyebrow))
  const showFooter = !hideChrome && Boolean(footnote)

  return (
    <>
      {showHeader && (
        <div className="signage-chrome">
          <span className="signage-chrome-name">
            {showConferenceBranding && conferenceName ? conferenceName : eyebrow ?? ''}
          </span>
          {showClock && (
            <span className="signage-chrome-clock">
              <Clock />
            </span>
          )}
        </div>
      )}
      <div className="signage-body">{children}</div>
      {showFooter && (
        <div className="signage-footer">
          <span>{footnote}</span>
          {showConferenceBranding && conferenceTagline && <span>{conferenceTagline}</span>}
        </div>
      )}
      {!showHeader && !showFooter && null}
    </>
  )
}
