/** Sanity document IDs only allow [a-zA-Z0-9._-]. Replace everything else with `-`. */
export function sanitizeDocumentId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9._-]/g, '-')
}
