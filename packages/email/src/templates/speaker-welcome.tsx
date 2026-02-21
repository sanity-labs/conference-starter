import {Heading, Text} from '@react-email/components'
import {EmailLayout, CtaButton} from '../components/layout'

interface SpeakerWelcomeProps {
  speakerName: string
  sessionTitle: string
  conferenceName?: string
}

export function SpeakerWelcome({
  speakerName,
  sessionTitle,
  conferenceName = 'Everything NYC 2026',
}: SpeakerWelcomeProps) {
  return (
    <EmailLayout
      preview={`Welcome to the ${conferenceName} speaker roster!`}
      conferenceName={conferenceName}
    >
      <Heading as="h1" style={heading}>
        Welcome, Speaker!
      </Heading>
      <Text style={text}>Hi {speakerName},</Text>
      <Text style={text}>
        Welcome to the {conferenceName} speaker roster! Your session{' '}
        <strong>{sessionTitle}</strong> has been added to our program and your speaker profile is
        now live on our website.
      </Text>

      <Text style={subheading}>Speaker Checklist</Text>
      <Text style={listItem}>
        &#9744; Review your speaker profile and let us know of any updates
      </Text>
      <Text style={listItem}>&#9744; Confirm your travel arrangements</Text>
      <Text style={listItem}>&#9744; Submit your slides 1 week before the event</Text>
      <Text style={listItem}>
        &#9744; Join the speaker Slack channel (invite link coming soon)
      </Text>

      <Text style={subheading}>Important Dates</Text>
      <Text style={text}>
        We&apos;ll share the full schedule and your assigned time slot closer to the event. In the
        meantime, please ensure your availability for the full conference dates.
      </Text>

      <CtaButton href="https://everything.nyc/speakers">View Your Speaker Profile</CtaButton>
      <Text style={muted}>
        For logistics questions (travel, AV requirements, dietary needs), reply to this email.
      </Text>
    </EmailLayout>
  )
}

SpeakerWelcome.PreviewProps = {
  speakerName: 'Alex Johnson',
  sessionTitle: 'Building AI-Powered Content Platforms with Sanity',
  conferenceName: 'Everything NYC 2026',
} satisfies SpeakerWelcomeProps

export default SpeakerWelcome

const heading: React.CSSProperties = {
  color: '#18181b',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 20px',
}

const text: React.CSSProperties = {
  color: '#27272a',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const subheading: React.CSSProperties = {
  color: '#18181b',
  fontSize: '17px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '24px 0 8px',
}

const listItem: React.CSSProperties = {
  color: '#27272a',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 4px',
  paddingLeft: '8px',
}

const muted: React.CSSProperties = {
  color: '#71717a',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
}
