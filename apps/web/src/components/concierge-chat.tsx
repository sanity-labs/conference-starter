'use client'

import {useState, useMemo, useRef, useEffect, useCallback} from 'react'
import {useChat} from '@ai-sdk/react'
import {DefaultChatTransport, type UIMessage} from 'ai'
import {Streamdown} from 'streamdown'

const STORAGE_KEY = 'concierge-messages'

function loadMessages(): UIMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveMessages(messages: UIMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

// Elements the floating button must never overlap. The footer is the
// default (holds the theme toggle, copyright, nav, social). Any page-
// level CTA that should stay unblocked can opt in with
// `data-concierge-avoid` and this observer picks it up automatically.
const AVOID_SELECTOR = 'footer, [data-concierge-avoid]'

function useAvoidCollision(): boolean {
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    const targets = document.querySelectorAll(AVOID_SELECTOR)
    if (targets.length === 0) return

    const visible = new Set<Element>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target)
          else visible.delete(entry.target)
        }
        setBlocked(visible.size > 0)
      },
      // Trigger slightly before the element hits the edge so the
      // button fades out before it would visually overlap.
      {rootMargin: '0px 0px -24px 0px', threshold: 0.01},
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return blocked
}

export function ConciergeChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [chatKey, setChatKey] = useState(0)
  const avoidCollision = useAvoidCollision()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    },
    [isOpen],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  function handleNewConversation() {
    localStorage.removeItem(STORAGE_KEY)
    setChatKey((k) => k + 1)
  }

  return (
    <aside aria-label="Conference concierge chat">
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-hidden={avoidCollision || undefined}
          tabIndex={avoidCollision ? -1 : 0}
          className={`fixed right-6 bottom-6 z-50 rounded-full border border-border bg-surface px-5 py-3 text-sm text-text-primary shadow-md hover:bg-surface-alt motion-safe:transition-opacity ${
            avoidCollision ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          Ask the Concierge
        </button>
      )}

      {isOpen && (
        <div className="fixed right-4 bottom-4 z-50 flex max-h-[80dvh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg sm:right-6 sm:bottom-6 sm:max-h-[32rem]">
          <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">Concierge</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNewConversation}
                aria-label="New conversation"
                className="text-xs text-text-muted hover:text-text-primary"
              >
                New chat
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="text-lg/none text-text-muted hover:text-text-primary"
              >
                &times;
              </button>
            </div>
          </header>

          <ChatMessages key={chatKey} />
        </div>
      )}
    </aside>
  )
}

function ChatMessages() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const initialMessages = useMemo(() => loadMessages(), [])
  const transport = useMemo(() => new DefaultChatTransport({api: '/api/chat'}), [])
  const {messages, status, sendMessage, error, clearError} = useChat({
    transport,
    messages: initialMessages,
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
  }, [messages])

  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages)
    }
  }, [messages])

  return (
    <>
      <ul
        role="list"
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4"
      >
        {messages.length === 0 && (
          <li className="text-sm text-text-muted">
            Ask me about the schedule, speakers, venue, or anything else about ContentOps Conf.
          </li>
        )}
        {messages.map((message) => (
          <li
            key={message.id}
            className={
              message.role === 'user'
                ? 'self-end max-w-[85%] whitespace-pre-wrap rounded-lg bg-text-primary px-3 py-2 text-sm text-surface'
                : 'prose prose-sm self-start max-w-[85%] rounded-lg bg-surface-muted px-3 py-2 text-sm text-text-primary [&_code]:!bg-surface [&_code]:!text-text-primary [&_a]:!text-text-primary [&_a]:!underline [&_strong]:!text-text-primary'
            }
          >
            {message.parts
              .filter((part) => part.type === 'text')
              .map((part, i) =>
                message.role === 'assistant' ? (
                  <Streamdown key={i} isAnimating={status === 'streaming'}>
                    {part.text}
                  </Streamdown>
                ) : (
                  <span key={i}>{part.text}</span>
                ),
              )}
          </li>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <li className="self-start rounded-lg bg-surface-muted px-3 py-2 text-sm text-text-secondary">
            Thinking...
          </li>
        )}
        <div ref={messagesEndRef} />
      </ul>

      {error && (
        <div className="flex items-center gap-2 border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          <p className="flex-1">Something went wrong. Try again.</p>
          <button
            type="button"
            onClick={clearError}
            className="text-red-700 hover:text-red-900"
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!input.trim() || isLoading) return
          sendMessage({text: input})
          setInput('')
        }}
        className="flex shrink-0 gap-2 border-t border-border px-4 py-3"
      >
        <input
          type="text"
          name="message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isLoading}
          aria-label="Chat message"
          className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none disabled:opacity-50 max-sm:text-base/6"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="shrink-0 rounded-md bg-text-primary px-4 py-2 text-sm text-surface hover:bg-text-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </>
  )
}
