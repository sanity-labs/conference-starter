/**
 * Strip standard markdown syntax for plain-text Telegram display.
 *
 * The Chat SDK's Telegram adapter sends messages without `parse_mode`,
 * so Telegram renders everything as plain text. This strips common
 * markdown artifacts that look ugly in plain text.
 */
export function stripMarkdown(text: string): string {
  return (
    text
      // Headings: "## Heading" → "Heading"
      .replace(/^#{1,6}\s+/gm, '')
      // Bold/italic combos: "***text***" → "text"
      .replace(/\*{3}(.+?)\*{3}/g, '$1')
      // Bold: "**text**" → "text"
      .replace(/\*{2}(.+?)\*{2}/g, '$1')
      // Italic: "*text*" → "text" (but not bullet "* item")
      .replace(/(?<!\n)(?<=\s|^)\*(?!\s)(.+?)(?<!\s)\*/g, '$1')
      // Inline code: "`code`" → "code"
      .replace(/`([^`]+)`/g, '$1')
      // Links: "[text](url)" → "text (url)"
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
      // Bullet lists: "* item" or "- item" → "• item"
      .replace(/^[\*\-]\s+/gm, '• ')
      // Horizontal rules
      .replace(/^---+$/gm, '')
      // Collapse multiple blank lines
      .replace(/\n{3,}/g, '\n\n')
  )
}

/**
 * Async iterable that strips markdown from each chunk.
 *
 * Imperfect for split tokens (e.g. `**` across chunks) but LLMs
 * typically emit markdown markers as single tokens.
 */
export async function* cleanMarkdownStream(
  stream: AsyncIterable<string>,
): AsyncIterable<string> {
  for await (const chunk of stream) {
    yield stripMarkdown(chunk)
  }
}
