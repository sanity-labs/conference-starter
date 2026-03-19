/**
 * Non-React email rendering — uses @portabletext/to-html and pre-generated
 * layout HTML. Safe for use in Turbopack-bundled API routes where React Email
 * components cause duplicate React instances.
 */

import {toHTML, escapeHTML} from '@portabletext/to-html'
import {emailLayoutHtml} from './generated/email-layout'

type PortableTextBody = Parameters<typeof toHTML>[0]

export function renderEmailBody(
  body: unknown[],
  variables?: Record<string, string>,
): string {
  return toHTML(body as PortableTextBody, {
    components: {
      ...(variables && {
        types: {
          pteInterpolationVariable: ({value}: {value: {variableKey: string}}) =>
            escapeHTML(variables[value.variableKey] ?? `{${value.variableKey}}`),
        },
      }),
    },
    onMissingComponent: false,
  })
}

export function wrapInLayout(bodyHtml: string, subject?: string): string {
  let html = emailLayoutHtml.replace('{{EMAIL_BODY}}', bodyHtml)
  if (subject) {
    html = html.replace('{{EMAIL_PREVIEW}}', escapeHTML(subject))
  }
  return html
}

export function interpolateSubject(
  subject: string,
  variables: Record<string, string>,
): string {
  return subject.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => variables[key] ?? `{{${key}}}`,
  )
}
