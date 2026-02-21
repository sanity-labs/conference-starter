import {Heading, Text} from '@react-email/components'
import {EmailLayout, CtaButton} from '../components/layout'

interface CfpConfirmationProps {
  submitterName: string
  sessionTitle: string
  conferenceName?: string
}

export function CfpConfirmation({
  submitterName,
  sessionTitle,
  conferenceName = 'Everything NYC 2026',
}: CfpConfirmationProps) {
  return (
    <EmailLayout preview={`We received your submission: ${sessionTitle}`} conferenceName={conferenceName}>
      <Heading as="h1" style={heading}>
        Submission Received
      </Heading>
      <Text style={text}>Hi {submitterName},</Text>
      <Text style={text}>
        Thanks for submitting <strong>{sessionTitle}</strong> to {conferenceName}! We&apos;re
        excited to review your proposal.
      </Text>
      <Text style={text}>Here&apos;s what happens next:</Text>
      <Text style={listItem}>1. Your submission will be screened by our AI-assisted review system</Text>
      <Text style={listItem}>2. Our editorial team will review top-scoring proposals</Text>
      <Text style={listItem}>3. You&apos;ll receive a decision via email</Text>
      <Text style={text}>
        This process typically takes 2-3 weeks. We&apos;ll keep you posted on any updates.
      </Text>
      <CtaButton href="https://everything.nyc">Visit Conference Website</CtaButton>
      <Text style={muted}>
        If you have questions about your submission, reply to this email.
      </Text>
    </EmailLayout>
  )
}

CfpConfirmation.PreviewProps = {
  submitterName: 'Alex Johnson',
  sessionTitle: 'Building AI-Powered Content Platforms with Sanity',
  conferenceName: 'Everything NYC 2026',
} satisfies CfpConfirmationProps

export default CfpConfirmation

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
