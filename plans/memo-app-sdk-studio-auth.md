# Memo: App SDK Authentication in Studio Tools

**Date**: 2026-02-22
**Author**: Knut + Claude
**Context**: Building the Schedule Builder — a custom Studio tool using `@sanity/sdk-react` hooks inside Sanity Studio
**Versions**: `@sanity/sdk-react@2.8.0`, `@sanity/sdk@2.8.0`, `sanity@5.11`

---

## TL;DR

Using `@sanity/sdk-react` hooks (`useQuery`, `useApplyDocumentActions`, etc.) inside a Sanity Studio custom tool requires careful auth setup. The documented `SDKStudioContext.Provider` pattern silently fails under cookie auth — the most common Studio auth mode. The working pattern passes explicit config with `studio: {}` to `SanityApp`, triggering the SDK's cookie auth fallback.

---

## The Problem

The App SDK docs and internal SDK team guidance suggest this pattern for using the SDK inside Studio:

```tsx
// BROKEN — renders blank under cookie auth
import {SanityApp, SDKStudioContext} from '@sanity/sdk-react'
import {useWorkspace} from 'sanity'

function MyTool() {
  const workspace = useWorkspace()
  return (
    <SDKStudioContext.Provider value={workspace}>
      <SanityApp fallback={<Spinner />}>
        <Content />
      </SanityApp>
    </SDKStudioContext.Provider>
  )
}
```

This compiles and type-checks, but **renders nothing at runtime** — no errors in the console, no 401s, just a blank tool pane. Studio is fully authenticated; the problem is entirely in the SDK's auth derivation.

---

## Root Cause: Token Observable vs. Cookie Auth

### How the SDK derives config from `SDKStudioContext`

When `SanityApp` receives no `config` prop, it reads from `SDKStudioContext` and calls `deriveConfigFromWorkspace()`:

```typescript
// @sanity/sdk-react — SanityApp.tsx
function deriveConfigFromWorkspace(workspace: StudioWorkspaceHandle): SanityConfig {
  return {
    projectId: workspace.projectId,
    dataset: workspace.dataset,
    studio: {
      auth: workspace.auth.token ? {token: workspace.auth.token} : undefined,
    },
  }
}
```

The `StudioWorkspaceHandle` type expects:

```typescript
interface StudioWorkspaceHandle {
  projectId: string
  dataset: string
  auth: {
    token?: TokenSource  // Observable-like: { subscribe(observer): {unsubscribe()} }
  }
}
```

### Where it breaks

Sanity Studio defaults to **cookie auth** — session cookies sent via `withCredentials: true`. In this mode:

- `workspace.auth.token` is an **RxJS Observable** (always truthy as an object)
- That Observable **emits `null`** — there's no bearer token, auth is cookie-based
- `deriveConfigFromWorkspace` sees `workspace.auth.token` as truthy (it's an object) and sets `studio.auth.token` to the Observable
- The SDK's `initializeStudioAuth()` subscribes to this `TokenSource`
- First emission is `null` — the SDK interprets this as "logged out"
- `AuthSwitch` renders `null` (in studio mode it returns nothing instead of redirecting to login)

### The auth initialization decision tree

```
initializeStudioAuth()
├─ tokenSource exists?
│  ├─ YES → initializeWithTokenSource() → subscribes to Observable
│  │         ├─ token emitted → LOGGED_IN
│  │         └─ null emitted  → LOGGED_OUT  ← THIS IS THE BUG
│  └─ NO  → initializeWithFallback()
│            ├─ check localStorage for stored token
│            └─ async checkForCookieAuth() → GET /users/me with withCredentials: true
│               ├─ 200 OK → LOGGED_IN (token: '', authMethod: 'cookie')
│               └─ error   → stays LOGGED_OUT
```

The bug: when `workspace.auth.token` is an Observable that emits `null`, the SDK takes the `initializeWithTokenSource` path (because `tokenSource` exists) instead of the `initializeWithFallback` path (which would correctly detect cookie auth).

---

## The Working Pattern

Pass explicit config with `studio: {}` to `SanityApp`. This bypasses `SDKStudioContext` derivation entirely:

```tsx
// WORKS — cookie auth fallback
import {SanityApp, useQuery} from '@sanity/sdk-react'
import {useWorkspace} from 'sanity'
import {useMemo} from 'react'

function MyTool() {
  const workspace = useWorkspace()
  const config = useMemo(
    () => ({
      projectId: workspace.projectId,
      dataset: workspace.dataset,
      studio: {},  // empty — no TokenSource, triggers cookie auth fallback
    }),
    [workspace.projectId, workspace.dataset],
  )

  return (
    <SanityApp config={config} fallback={<Spinner />}>
      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </SanityApp>
  )
}
```

### Why this works

1. `config` prop takes precedence over `SDKStudioContext` in `SanityApp`
2. `studio: {}` makes `isStudioConfig()` return `true` (it checks `!!config.studio`)
3. No `studio.auth.token` → `initializeStudioAuth` takes the **fallback path**
4. Fallback calls `checkForCookieAuth()` — a `GET /users/me` with `withCredentials: true`
5. Studio's session cookies are already set in the browser → 200 OK → `LOGGED_IN`
6. `AuthSwitch` renders children → tool works

### Key details

- The cookie check has a **10-second timeout** — there may be a brief loading state before auth resolves
- Token is set to `''` (empty string) in cookie mode — all subsequent SDK requests use `withCredentials: true`
- `useWorkspace()` from `sanity` provides `projectId` and `dataset` — no hardcoding needed

---

## What This Enables

Once the auth bridge is set up, all `@sanity/sdk-react` hooks work inside Studio:

- `useQuery()` — live/reactive GROQ queries with Suspense
- `useDocuments()` — document list with handles
- `useDocumentProjection()` — projected fields from a document handle
- `useApplyDocumentActions()` + `createDocument()` / `publishDocument()` / `deleteDocument()` — atomic mutations with optimistic updates
- `useEditDocument()` — functional updates with minimal diffs

These are significantly higher-level than Studio's native `useClient()` + `client.fetch()` / `client.create()` pattern and include built-in optimistic updates and reactivity.

---

## Upstream Status

- **Studio PR #12157**: Will add native `SDKStudioContext` support so `SanityApp` works without explicit config. Once this lands, the `studio: {}` workaround can be removed.
- **SDK bug**: `deriveConfigFromWorkspace()` doesn't distinguish between "Observable that emits null" (cookie auth) and "Observable that emits a token" (token auth). The fix should either:
  - Not pass the Observable as `TokenSource` if it emits `null`
  - Or handle `null` emissions gracefully in `initializeWithTokenSource` by falling back to cookie auth

---

## Suggested Rules/Skills Updates

### For `sanity-best-practices` or a new `sanity-app-sdk` rule

**Rule: Using App SDK hooks in Studio custom tools**

```
When building a custom Studio tool that uses `@sanity/sdk-react` hooks:

1. Register the tool via `definePlugin` with a `tool` definition
2. In the tool component, get workspace info from `useWorkspace()` (from `sanity`)
3. Wrap content in `<SanityApp>` with EXPLICIT config — do NOT use `SDKStudioContext.Provider`
4. The config MUST include `studio: {}` (empty object) to enable cookie auth fallback

Pattern:
  const workspace = useWorkspace()
  const config = useMemo(() => ({
    projectId: workspace.projectId,
    dataset: workspace.dataset,
    studio: {},
  }), [workspace.projectId, workspace.dataset])

  <SanityApp config={config} fallback={...}>
    <Suspense fallback={...}>
      <Content /> {/* useQuery, useApplyDocumentActions, etc. work here */}
    </Suspense>
  </SanityApp>

Anti-pattern (silently fails under cookie auth):
  <SDKStudioContext.Provider value={workspace}>
    <SanityApp> {/* no config — derives from context, breaks on cookie auth */}
```

### For `sanity-schema` rule (Studio tools section)

Add a note that custom tools can use App SDK hooks for data operations, with a link to the auth pattern above.

### For any AI agent / coding assistant rules

When generating Studio tool code that uses `@sanity/sdk-react`:
- Always use explicit `config` with `studio: {}`
- Never use `SDKStudioContext.Provider` directly (until Studio ships native support)
- Always wrap SDK hook consumers in `<Suspense>` (SDK hooks suspend during initial load)
- Use `useMemo` for the config object to avoid unnecessary re-renders

---

## Verification Checklist

When testing a Studio tool that uses App SDK hooks:

- [ ] Tool tab appears in Studio top nav
- [ ] Content renders (not blank) after Studio login
- [ ] `useQuery` returns live data
- [ ] Mutations via `useApplyDocumentActions` create/update/delete documents
- [ ] Changes made in Desk tool reflect in the custom tool (reactivity)
- [ ] Changes made in the custom tool appear in Desk tool
- [ ] No 401 errors in browser network tab
- [ ] No console errors related to auth
