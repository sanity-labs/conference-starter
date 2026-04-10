'use client'

import {useState, useRef, useEffect} from 'react'
import {useChat} from '@ai-sdk/react'
import {DefaultChatTransport} from 'ai'

const transport = new DefaultChatTransport({api: '/api/chat'})

export function ConciergeChat() {
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [input, setInput] = useState('')
  const {messages, status, sendMessage} = useChat({transport})

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
  }, [messages])

  return (
    <aside aria-label="Conference concierge chat">
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 50,
            padding: '0.75rem 1.25rem',
            borderRadius: '9999px',
            border: '1px solid var(--color-border, #ccc)',
            background: 'var(--color-surface, #fff)',
            color: 'var(--color-text-primary, #000)',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Ask the Concierge
        </button>
      )}

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 50,
            width: '24rem',
            maxHeight: '32rem',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '0.75rem',
            border: '1px solid var(--color-border, #ccc)',
            background: 'var(--color-surface, #fff)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          }}
        >
          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--color-border, #ccc)',
            }}
          >
            <strong>Concierge</strong>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.25rem',
                lineHeight: 1,
                color: 'inherit',
              }}
            >
              &times;
            </button>
          </header>

          <ul
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '0.75rem 1rem',
              margin: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {messages.length === 0 && (
              <li style={{color: 'var(--color-text-secondary, #666)', fontSize: '0.875rem'}}>
                Ask me about the schedule, speakers, venue, or anything else about ContentOps Conf.
              </li>
            )}
            {messages.map((message) => (
              <li
                key={message.id}
                style={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background:
                    message.role === 'user'
                      ? 'var(--color-accent, #0070f3)'
                      : 'var(--color-muted, #f0f0f0)',
                  color: message.role === 'user' ? '#fff' : 'inherit',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {message.parts
                  .filter((part) => part.type === 'text')
                  .map((part, i) => (
                    <span key={i}>{part.text}</span>
                  ))}
              </li>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <li
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'var(--color-muted, #f0f0f0)',
                  color: 'var(--color-text-secondary, #666)',
                }}
              >
                Thinking...
              </li>
            )}
            <div ref={messagesEndRef} />
          </ul>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!input.trim() || isLoading) return
              sendMessage({text: input})
              setInput('')
            }}
            style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderTop: '1px solid var(--color-border, #ccc)',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--color-border, #ccc)',
                fontSize: '0.875rem',
                background: 'transparent',
                color: 'inherit',
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid transparent',
                background: 'var(--color-accent, #0070f3)',
                color: '#fff',
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoading || !input.trim() ? 0.5 : 1,
                fontSize: '0.875rem',
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </aside>
  )
}
