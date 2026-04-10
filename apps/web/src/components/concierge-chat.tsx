'use client'

import {useState, useMemo, useRef, useEffect, useCallback} from 'react'
import {useChat} from '@ai-sdk/react'
import {DefaultChatTransport} from 'ai'

export function ConciergeChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const transport = useMemo(() => new DefaultChatTransport({api: '/api/chat'}), [])
  const {messages, status, sendMessage, error, clearError} = useChat({transport})

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
  }, [messages])

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

  return (
    <aside aria-label="Conference concierge chat">
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed right-6 bottom-6 z-50 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-gray-900 shadow-md transition-colors hover:bg-gray-50"
        >
          Ask the Concierge
        </button>
      )}

      {isOpen && (
        <div className="fixed right-4 bottom-4 z-50 flex max-h-[80dvh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg sm:right-6 sm:bottom-6 sm:max-h-[32rem]">
          <header className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Concierge</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="text-lg/none text-gray-400 transition-colors hover:text-gray-600"
            >
              &times;
            </button>
          </header>

          <ul
            role="list"
            aria-live="polite"
            className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4"
          >
            {messages.length === 0 && (
              <li className="text-sm text-gray-500">
                Ask me about the schedule, speakers, venue, or anything else about ContentOps Conf.
              </li>
            )}
            {messages.map((message) => (
              <li
                key={message.id}
                className={
                  message.role === 'user'
                    ? 'self-end max-w-[85%] whitespace-pre-wrap rounded-lg bg-gray-900 px-3 py-2 text-sm text-white'
                    : 'self-start max-w-[85%] whitespace-pre-wrap rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-900'
                }
              >
                {message.parts
                  .filter((part) => part.type === 'text')
                  .map((part, i) => (
                    <span key={i}>{part.text}</span>
                  ))}
              </li>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <li className="self-start rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500">
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
                className="text-red-500 hover:text-red-700"
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
            className="flex shrink-0 gap-2 border-t border-gray-200 px-4 py-3"
          >
            <input
              type="text"
              name="message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={isLoading}
              aria-label="Chat message"
              className="min-w-0 flex-1 rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none disabled:opacity-50 max-sm:text-base/6"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="shrink-0 rounded-md bg-gray-900 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </aside>
  )
}
