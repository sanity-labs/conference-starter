import {useEffect, useRef, useState} from 'react'
import type {SanityDocument} from 'sanity'

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
        const res = await fetch('/api/email-preview', {
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

  return (
    <div style={{padding: '16px', height: '100%', display: 'flex', flexDirection: 'column'}}>
      {typeof displayed?.subject === 'string' && displayed.subject && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#f4f4f5',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          <strong>Subject:</strong> {interpolateSubject(String(displayed.subject))}
        </div>
      )}

      {loading && (
        <div style={{padding: '16px', color: '#71717a', fontSize: '14px'}}>
          Rendering preview...
        </div>
      )}

      {error && (
        <div style={{padding: '16px', color: '#dc2626', fontSize: '14px'}}>{error}</div>
      )}

      {html && (
        <iframe
          srcDoc={html}
          style={{
            flex: 1,
            border: '1px solid #e4e4e7',
            borderRadius: '6px',
            width: '100%',
            minHeight: '600px',
            backgroundColor: '#ffffff',
          }}
          title="Email Preview"
        />
      )}

      {!html && !loading && !error && (
        <div style={{padding: '16px', color: '#71717a', fontSize: '14px'}}>
          Add content to the email body to see a preview.
        </div>
      )}
    </div>
  )
}
