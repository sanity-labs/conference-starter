import {Heading, Text} from '@react-email/components'
import {EmailLayout, CtaButton} from '../components/layout'

interface CfpRejectedProps {
  submitterName: string
  sessionTitle: string
  conferenceName?: string
}

export function CfpRejected({
  submitterName,
  sessionTitle,
  conferenceName = 'Everything NYC 2026',
}: CfpRejectedProps) {
  return (
    <EmailLayout
      preview={`Update on your submission: ${sessionTitle}`}
      conferenceName={conferenceName}
    >
      <Heading as="h1" style={heading}>
        Thank You for Submitting
      </Heading>
      <Text style={text}>Hi {submitterName},</Text>
      <Text style={text}>
        Thank you for submitting <strong>{sessionTitle}</strong> to {conferenceName}. We
        appreciate the time and effort you put into your proposal.
      </Text>
      <Text style={text}>
        After careful review, we&apos;re unable to include your session in this year&apos;s
        program. We received an exceptional number of submissions and the selection process was
        highly competitive.
      </Text>
      <Text style={text}>
        This doesn&apos;t reflect on the quality of your work — we encourage you to submit again
        in the future and to join us as an attendee. We&apos;d love to see you there.
      </Text>
      <CtaButton href="https://everything.nyc">Register to Attend</CtaButton>
      <Text style={muted}>
        If you have questions about our review process, feel free to reply to this email.
      </Text>
    </EmailLayout>
  )
}

CfpRejected.PreviewProps = {
  submitterName: 'Alex Johnson',
  sessionTitle: 'Building AI-Powered Content Platforms with Sanity',
  conferenceName: 'Everything NYC 2026',
} satisfies CfpRejectedProps

export default CfpRejected

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

const muted: React.CSSProperties = {
  color: '#71717a',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
}
