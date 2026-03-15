/**
 * Pre-renders EmailLayout to static HTML for use in Sanity Functions.
 * The generated file replaces React Email rendering at send time —
 * Functions only need to insert rendered Portable Text body HTML.
 *
 * Usage: pnpm --filter @repo/email generate-layout
 */

import {render} from '@react-email/render'
import {createElement} from 'react'
import {writeFileSync, mkdirSync} from 'node:fs'
import {resolve, dirname} from 'node:path'
import {EmailLayout} from '../src/components/layout'

const PLACEHOLDER = '{{EMAIL_BODY}}'

const OUTPUT_PATH = resolve(
  import.meta.dirname,
  '../../../apps/studio/functions/_shared/email-layout.ts',
)

async function main() {
  const element = createElement(EmailLayout, {
    preview: '{{EMAIL_PREVIEW}}',
    conferenceName: 'Everything NYC 2026',
    children: createElement('div', {
      dangerouslySetInnerHTML: {__html: PLACEHOLDER},
    }),
  })

  const html = await render(element)

  const output = `// AUTO-GENERATED — do not edit manually.
// Source: packages/email/scripts/generate-layout.ts
// Regenerate: pnpm --filter @repo/email generate-layout
export const emailLayoutHtml = ${JSON.stringify(html)}
`

  mkdirSync(dirname(OUTPUT_PATH), {recursive: true})
  writeFileSync(OUTPUT_PATH, output, 'utf-8')
  console.log(`Generated ${OUTPUT_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
