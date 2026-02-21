import {Heading, Text} from '@react-email/components'
import {EmailLayout, CtaButton} from '../components/layout'

interface CfpAcceptedProps {
  submitterName: string
  sessionTitle: string
  conferenceName?: string
}

export function CfpAccepted({
  submitterName,
  sessionTitle,
  conferenceName = 'Everything NYC 2026',
}: CfpAcceptedProps) {
  return (
    <EmailLayout
      preview={`Your talk "${sessionTitle}" has been accepted!`}
      conferenceName={conferenceName}
    >
      <Heading as="h1" style={heading}>
        Your Talk Has Been Accepted!
      </Heading>
      <Text style={text}>Hi {submitterName},</Text>
      <Text style={text}>
        Great news! We&apos;re thrilled to let you know that <strong>{sessionTitle}</strong> has
        been accepted for {conferenceName}.
      </Text>
      <Text style={text}>
        We received many outstanding proposals and yours stood out. We can&apos;t wait for you to
        share your ideas with our audience.
      </Text>
      <Text style={subheading}>Next Steps</Text>
      <Text style={listItem}>1. Confirm your participation by replying to this email</Text>
      <Text style={listItem}>2. We&apos;ll create your speaker profile on our website</Text>
      <Text style={listItem}>
        3. You&apos;ll receive a speaker welcome email with logistics details
      </Text>
      <CtaButton href="https://everything.nyc/speakers">View Speaker Information</CtaButton>
      <Text style={muted}>
        If you can no longer present, please let us know as soon as possible so we can offer the
        slot to another speaker.
      </Text>
    </EmailLayout>
  )
}

CfpAccepted.PreviewProps = {
  submitterName: 'Alex Johnson',
  sessionTitle: 'Building AI-Powered Content Platforms with Sanity',
  conferenceName: 'Everything NYC 2026',
} satisfies CfpAcceptedProps

export default CfpAccepted

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
  margin: '0 0 8px',
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
