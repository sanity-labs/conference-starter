import {portableTextToMarkdown} from '@portabletext/markdown'

/**
 * Convert Portable Text blocks to markdown string.
 * Wraps @portabletext/markdown with null handling.
 */
export function ptToMarkdown(blocks: unknown[] | null | undefined): string {
  if (!blocks || blocks.length === 0) return ''
  return portableTextToMarkdown(blocks as Parameters<typeof portableTextToMarkdown>[0])
}
