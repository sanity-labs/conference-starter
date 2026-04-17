'use client'

import {useActionState} from 'react'

type FormState = {
  success: boolean | null
  errors?: Record<string, string[]>
  error?: string
}

async function submitCfp(_prev: FormState, formData: FormData): Promise<FormState> {
  const topics = formData.get('topics') as string
  const body = {
    sessionTitle: formData.get('sessionTitle'),
    sessionType: formData.get('sessionType'),
    abstract: formData.get('abstract'),
    level: formData.get('level'),
    topics: topics
      ? topics
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    submitterName: formData.get('submitterName'),
    submitterEmail: formData.get('submitterEmail'),
    company: formData.get('company') || undefined,
    bio: formData.get('bio'),
    _gotcha: formData.get('_gotcha'),
  }

  const response = await fetch('/api/cfp/submit', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    return {success: false, errors: data.errors, error: data.error}
  }

  return {success: true}
}

export function CfpForm() {
  const [state, action, isPending] = useActionState(submitCfp, {success: null})

  if (state.success) {
    return (
      <section className="mt-8 rounded-md border border-border bg-surface-alt p-6" aria-live="polite">
        <h2 className="text-2xl font-semibold tracking-tight">Thank you!</h2>
        <p className="mt-2 text-text-secondary">
          Your submission has been received. We will review it and get back to you.
        </p>
      </section>
    )
  }

  return (
    <form action={action} className="mt-8 space-y-6">
      {state.error && (
        <p className="rounded-md border border-error bg-error/5 p-3 text-sm text-error">
          {state.error}
        </p>
      )}

      {/* Honeypot */}
      <div aria-hidden="true" style={{position: 'absolute', left: '-9999px'}}>
        <label htmlFor="_gotcha">
          Do not fill this out
          <input type="text" id="_gotcha" name="_gotcha" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset>
        <legend className="text-lg font-semibold">Your Proposal</legend>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="sessionTitle" className="block text-base font-medium sm:text-sm">
              Session Title
            </label>
            <input
              type="text"
              id="sessionTitle"
              name="sessionTitle"
              required
              maxLength={200}
              className="form-input"
              aria-invalid={state.errors?.sessionTitle ? 'true' : undefined}
              aria-describedby={state.errors?.sessionTitle ? 'sessionTitle-error' : undefined}
            />
            <FieldError id="sessionTitle-error" errors={state.errors?.sessionTitle} />
          </div>

          <div>
            <label htmlFor="sessionType" className="block text-base font-medium sm:text-sm">
              Session Type
            </label>
            <select
              id="sessionType"
              name="sessionType"
              required
              className="form-input"
              aria-invalid={state.errors?.sessionType ? 'true' : undefined}
              aria-describedby={state.errors?.sessionType ? 'sessionType-error' : undefined}
            >
              <option value="">Select a format</option>
              <option value="talk">Talk (30 min)</option>
              <option value="lightning">Lightning Talk (10 min)</option>
              <option value="panel">Panel</option>
              <option value="workshop">Workshop (90 min)</option>
            </select>
            <FieldError id="sessionType-error" errors={state.errors?.sessionType} />
          </div>

          <div>
            <label htmlFor="abstract" className="block text-base font-medium sm:text-sm">
              Abstract
            </label>
            <textarea
              id="abstract"
              name="abstract"
              required
              rows={6}
              minLength={100}
              maxLength={2000}
              className="form-input"
              aria-invalid={state.errors?.abstract ? 'true' : undefined}
              aria-describedby="abstract-hint abstract-error"
            />
            <p id="abstract-hint" className="mt-1 text-sm text-text-muted sm:text-xs">100-2000 characters</p>
            <FieldError id="abstract-error" errors={state.errors?.abstract} />
          </div>

          <div>
            <label htmlFor="level" className="block text-base font-medium sm:text-sm">
              Level
            </label>
            <select
              id="level"
              name="level"
              required
              className="form-input"
              aria-invalid={state.errors?.level ? 'true' : undefined}
              aria-describedby={state.errors?.level ? 'level-error' : undefined}
            >
              <option value="">Select a level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <FieldError id="level-error" errors={state.errors?.level} />
          </div>

          <div>
            <label htmlFor="topics" className="block text-base font-medium sm:text-sm">
              Topics
            </label>
            <input
              type="text"
              id="topics"
              name="topics"
              required
              className="form-input"
              aria-invalid={state.errors?.topics ? 'true' : undefined}
              aria-describedby="topics-hint topics-error"
            />
            <p id="topics-hint" className="mt-1 text-sm text-text-muted sm:text-xs">Comma-separated (e.g., React, AI, Design Systems)</p>
            <FieldError id="topics-error" errors={state.errors?.topics} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-semibold">About You</legend>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="submitterName" className="block text-base font-medium sm:text-sm">
              Name
            </label>
            <input
              type="text"
              id="submitterName"
              name="submitterName"
              required
              className="form-input"
              aria-invalid={state.errors?.submitterName ? 'true' : undefined}
              aria-describedby={state.errors?.submitterName ? 'submitterName-error' : undefined}
            />
            <FieldError id="submitterName-error" errors={state.errors?.submitterName} />
          </div>

          <div>
            <label htmlFor="submitterEmail" className="block text-base font-medium sm:text-sm">
              Email
            </label>
            <input
              type="email"
              id="submitterEmail"
              name="submitterEmail"
              required
              className="form-input"
              aria-invalid={state.errors?.submitterEmail ? 'true' : undefined}
              aria-describedby={state.errors?.submitterEmail ? 'submitterEmail-error' : undefined}
            />
            <FieldError id="submitterEmail-error" errors={state.errors?.submitterEmail} />
          </div>

          <div>
            <label htmlFor="company" className="block text-base font-medium sm:text-sm">
              Company / Organization
            </label>
            <input
              type="text"
              id="company"
              name="company"
              className="form-input"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-base font-medium sm:text-sm">
              Speaker Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              required
              rows={4}
              minLength={50}
              maxLength={500}
              className="form-input"
              aria-invalid={state.errors?.bio ? 'true' : undefined}
              aria-describedby="bio-hint bio-error"
            />
            <p id="bio-hint" className="mt-1 text-sm text-text-muted sm:text-xs">50-500 characters</p>
            <FieldError id="bio-error" errors={state.errors?.bio} />
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary"
      >
        {isPending ? 'Submitting…' : 'Submit Proposal'}
      </button>
    </form>
  )
}

function FieldError({id, errors}: {id: string; errors?: string[]}) {
  if (!errors || errors.length === 0) return null
  return (
    <ul id={id} className="mt-1 text-sm text-error">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  )
}
