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
      <section className="mt-8">
        <h2 className="text-2xl font-bold">Thank you!</h2>
        <p className="mt-2 text-gray-600">
          Your submission has been received. We will review it and get back to you.
        </p>
      </section>
    )
  }

  return (
    <form action={action} className="mt-8 space-y-6">
      {state.error && <p className="text-red-600">{state.error}</p>}

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
            <label htmlFor="sessionTitle" className="block text-sm font-medium">
              Session Title
            </label>
            <input
              type="text"
              id="sessionTitle"
              name="sessionTitle"
              required
              maxLength={200}
              className="mt-1 block w-full border px-3 py-2"
            />
            <FieldError errors={state.errors?.sessionTitle} />
          </div>

          <div>
            <label htmlFor="sessionType" className="block text-sm font-medium">
              Session Type
            </label>
            <select
              id="sessionType"
              name="sessionType"
              required
              className="mt-1 block w-full border px-3 py-2"
            >
              <option value="">Select a format</option>
              <option value="talk">Talk (30 min)</option>
              <option value="lightning">Lightning Talk (10 min)</option>
              <option value="panel">Panel</option>
              <option value="workshop">Workshop (90 min)</option>
            </select>
            <FieldError errors={state.errors?.sessionType} />
          </div>

          <div>
            <label htmlFor="abstract" className="block text-sm font-medium">
              Abstract
            </label>
            <textarea
              id="abstract"
              name="abstract"
              required
              rows={6}
              minLength={100}
              maxLength={2000}
              className="mt-1 block w-full border px-3 py-2"
            />
            <p className="mt-1 text-xs text-gray-500">100-2000 characters</p>
            <FieldError errors={state.errors?.abstract} />
          </div>

          <div>
            <label htmlFor="level" className="block text-sm font-medium">
              Level
            </label>
            <select
              id="level"
              name="level"
              required
              className="mt-1 block w-full border px-3 py-2"
            >
              <option value="">Select a level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <FieldError errors={state.errors?.level} />
          </div>

          <div>
            <label htmlFor="topics" className="block text-sm font-medium">
              Topics
            </label>
            <input
              type="text"
              id="topics"
              name="topics"
              required
              className="mt-1 block w-full border px-3 py-2"
            />
            <p className="mt-1 text-xs text-gray-500">Comma-separated (e.g., React, AI, Design Systems)</p>
            <FieldError errors={state.errors?.topics} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-semibold">About You</legend>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="submitterName" className="block text-sm font-medium">
              Name
            </label>
            <input
              type="text"
              id="submitterName"
              name="submitterName"
              required
              className="mt-1 block w-full border px-3 py-2"
            />
            <FieldError errors={state.errors?.submitterName} />
          </div>

          <div>
            <label htmlFor="submitterEmail" className="block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="submitterEmail"
              name="submitterEmail"
              required
              className="mt-1 block w-full border px-3 py-2"
            />
            <FieldError errors={state.errors?.submitterEmail} />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium">
              Company / Organization
            </label>
            <input
              type="text"
              id="company"
              name="company"
              className="mt-1 block w-full border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium">
              Speaker Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              required
              rows={4}
              minLength={50}
              maxLength={500}
              className="mt-1 block w-full border px-3 py-2"
            />
            <p className="mt-1 text-xs text-gray-500">50-500 characters</p>
            <FieldError errors={state.errors?.bio} />
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="border px-6 py-2 font-medium disabled:opacity-50"
      >
        {isPending ? 'Submitting…' : 'Submit Proposal'}
      </button>
    </form>
  )
}

function FieldError({errors}: {errors?: string[]}) {
  if (!errors || errors.length === 0) return null
  return (
    <ul className="mt-1 text-sm text-red-600">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  )
}
