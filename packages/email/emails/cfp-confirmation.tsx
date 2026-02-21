import {CfpConfirmation} from '../src/templates/cfp-confirmation'

export default function CfpConfirmationPreview() {
  return (
    <CfpConfirmation
      submitterName="Alex Johnson"
      sessionTitle="Building AI-Powered Content Platforms with Sanity"
      conferenceName="Everything NYC 2026"
    />
  )
}
