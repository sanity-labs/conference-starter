import {useCallback, useEffect, useRef, useState} from 'react'
import type {SanityDocument} from 'sanity'

const PREVIEW_API_URL = process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:3000'

const sampleVariables: Record<string, string> = {
  submitterName: 'Alex Johnson',
  sessionTitle: 'Building AI-Powered Content Platforms',
  speakerName: 'Alex Johnson',
  conferenceName: 'Everything NYC 2026',
}

function interpolateSubject(subject: string): string {
  return subject.replace(/\{\{(\w+)\}\}/g, (_, key) => sampleVariables[key] ?? `{{${key}}}`)
}

interface EmailPreviewProps {
  document: {
    displayed: SanityDocument
  }
}

export function EmailPreview({document: {displayed}}: EmailPreviewProps) {
  const [html, setHtml] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Write HTML directly into iframe document to avoid remounting
  const writeToIframe = useCallback((content: string) => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument
    if (!doc) return
    doc.open()
    doc.write(content)
    doc.close()
  }, [])

  useEffect(() => {
    if (html) writeToIframe(html)
  }, [html, writeToIframe])

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(async () => {
      if (!displayed?.body) {
        setHtml('')
        return
      }

      setLoading(true)
      setError('')

      try {
        const res = await fetch(`${PREVIEW_API_URL}/api/email-preview`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            subject: displayed.subject,
            body: displayed.body,
            name: displayed.name,
            variables: sampleVariables,
          }),
        })

        if (!res.ok) {
          throw new Error(`Preview failed: ${res.statusText}`)
        }

        const data = await res.json()
        setHtml(data.html)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render preview')
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [displayed?.subject, displayed?.body, displayed?.name])

  const hasContent = Boolean(html)

  return (
    <div style={{padding: '16px', height: '100%', display: 'flex', flexDirection: 'column'}}>
      {typeof displayed?.subject === 'string' && displayed.subject && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#f4f4f5',
            color: '#27272a',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          <strong>Subject:</strong> {interpolateSubject(String(displayed.subject))}
        </div>
      )}

      {error && (
        <div style={{padding: '16px', color: '#dc2626', fontSize: '14px'}}>{error}</div>
      )}

      {hasContent && (
        <iframe
          ref={iframeRef}
          style={{
            flex: 1,
            border: '1px solid #e4e4e7',
            borderRadius: '6px',
            width: '100%',
            minHeight: '600px',
            backgroundColor: '#ffffff',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 150ms ease',
          }}
          title="Email Preview"
        />
      )}

      {!hasContent && !loading && !error && (
        <div style={{padding: '16px', color: '#71717a', fontSize: '14px'}}>
          Add content to the email body to see a preview.
        </div>
      )}
    </div>
  )
}
