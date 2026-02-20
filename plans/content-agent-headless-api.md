# Sanity Content Agent Headless API — Reference

> **Source:** Internal docs from `sanity-io/sanity-agent` (private repo). Fetched via GitHub CLI.
> **Status:** Preview (`vX` API version)

## Summary

The Content Agent API lets you integrate Content Agent into your own applications via HTTP. SSE streaming, fully compatible with Vercel AI SDK.

### Two Endpoints

| Endpoint | Purpose | Stateful? |
|----------|---------|-----------|
| `POST /{orgId}/threads/{threadId}` | Conversational chat with thread history | Yes — server-side message persistence |
| `POST /prompt` | One-shot stateless prompt | No |

### Key Capabilities

- **Read/Write control** — configure `read` and `write` independently (`false`, `minimal`, `standard`)
- **GROQ filters** — restrict which document types the agent can see/modify
- **Perspectives** — lock to `published`, `drafts`, or specific releases
- **Custom instructions** — system prompt customization
- **User message context** — pass metadata (e.g., user role, channel) as XML tags
- **Feature overrides** — toggle web search independently of read/write presets
- **Write safety** — agent can only write to drafts/versioned docs, never published directly

### TypeScript SDK

```typescript
import { createContentAgent } from 'content-agent'

const contentAgent = createContentAgent({
  organizationId: 'your-org-id',
  token: 'your-sanity-token',
})

// Threaded conversation
const model = contentAgent.agent('concierge-thread', {
  application: { key: 'projectId.datasetName' },
  config: {
    capabilities: { read: true, write: false },
    filter: { read: '_type in ["session", "speaker", "track", "venue"]' },
    instruction: 'You are a helpful conference concierge for Everything NYC 2026.',
  },
})

// One-shot prompt
const { text } = await contentAgent.prompt(
  {
    application: { key: 'projectId.datasetName' },
    config: { capabilities: { read: true, write: false } },
    instructions: 'Answer concisely about the conference schedule.',
  },
  { message: 'What React talks are on Day 2?' }
)
```

### Vercel AI SDK Integration (React)

```typescript
import { useChat } from '@ai-sdk/react'

function ConciergeChatbot() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: 'https://api.sanity.io/vX/agent/your-org-id/threads/concierge',
    headers: { Authorization: `Bearer ${authToken}` },
    body: {
      config: {
        instruction: 'You are the Everything NYC 2026 conference concierge.',
        capabilities: { read: true, write: false },
        filter: {
          read: '_type in ["session", "speaker", "track", "venue", "sponsor"]',
        },
      },
    },
  })
  // ... render chat UI
}
```

### Conference Concierge Implications

This API is **purpose-built** for the concierge use case:
- Read-only access to conference content (sessions, speakers, schedule, venue)
- GROQ filters restrict to relevant document types only
- Custom instructions set the conference context
- Thread-based conversations for follow-up questions
- SSE streaming for responsive chat UX
- Vercel AI SDK = drop-in React component

**vs. `@sanity/agent-context`:** The headless API is simpler for our use case — it's a direct conversational interface to the Content Lake. `agent-context` is an MCP toolkit for giving external AI agents Sanity context, which is more complex than we need for a Q&A chatbot.

### Auth Model
- Sanity auth token in `Authorization: Bearer` header
- For attendee-facing chatbot: proxy through Next.js API route (don't expose token to client)

### Open Questions
- AI Credits consumption for chat interactions?
- Rate limits for the headless API?
- GA timeline?
