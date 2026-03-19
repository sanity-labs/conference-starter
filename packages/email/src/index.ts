// React Email components — for template authoring and dev preview ONLY.
// DO NOT import these in Next.js API routes — Turbopack bundles a separate
// React instance, causing "Invalid hook call" errors. Use @repo/email/render-html instead.
export {EmailLayout, CtaButton} from './components/layout'
export {PortableTextEmail} from './components/portable-text-email'

// Send helpers
export {sendEmail, sendBatch, resend} from './send'
