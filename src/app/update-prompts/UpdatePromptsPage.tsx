'use client'

import { useEffect, useState } from 'react'

interface Prompt {
  id: number
  name: string
  body: string
  description: string
  version: number
  updated_at: string
}

const DISPLAY_NAMES: Record<string, string> = {
  compliance_analysis: 'Compliance Analysis',
  receipt_parsing: 'Receipt Parsing',
}

export default function UpdatePromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/prompts')
      .then(r => r.json())
      .then((rows: Prompt[]) => {
        setPrompts(rows)
        const initial: Record<string, string> = {}
        for (const p of rows) initial[p.name] = p.body
        setDrafts(initial)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(name: string) {
    setSaving(s => ({ ...s, [name]: true }))
    setErrors(e => ({ ...e, [name]: '' }))
    setSaved(s => ({ ...s, [name]: false }))

    const res = await fetch('/api/prompts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, body: drafts[name] }),
    })

    setSaving(s => ({ ...s, [name]: false }))

    if (!res.ok) {
      const data = await res.json()
      setErrors(e => ({ ...e, [name]: data.error ?? 'Save failed' }))
      return
    }

    const updated: Prompt = await res.json()
    setPrompts(ps => ps.map(p => p.name === name ? updated : p))
    setSaved(s => ({ ...s, [name]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [name]: false })), 2500)
  }

  function handleReset(name: string) {
    const original = prompts.find(p => p.name === name)
    if (original) setDrafts(d => ({ ...d, [name]: original.body }))
  }

  if (loading) return <div className="p-8 text-sm text-zinc-500">Loading prompts…</div>

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold">Update Prompts</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Changes take effect immediately — the next analysis run will use the updated prompt.
        </p>
      </div>

      {prompts.map(prompt => {
        const isDirty = drafts[prompt.name] !== prompt.body
        return (
          <section key={prompt.name} className="flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">
                  {DISPLAY_NAMES[prompt.name] ?? prompt.name}
                </h2>
                {prompt.description && (
                  <p className="mt-0.5 text-sm text-zinc-500">{prompt.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-zinc-400">v{prompt.version}</span>
                <span className="text-xs text-zinc-400">
                  saved {new Date(prompt.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <textarea
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-y min-h-64"
              value={drafts[prompt.name] ?? ''}
              onChange={e => setDrafts(d => ({ ...d, [prompt.name]: e.target.value }))}
              spellCheck={false}
            />

            {errors[prompt.name] && (
              <p className="text-sm text-red-600">{errors[prompt.name]}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSave(prompt.name)}
                disabled={saving[prompt.name] || !isDirty}
                className="rounded bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-40"
              >
                {saving[prompt.name] ? 'Saving…' : 'Save'}
              </button>
              {isDirty && (
                <button
                  onClick={() => handleReset(prompt.name)}
                  className="rounded border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  Reset
                </button>
              )}
              {saved[prompt.name] && (
                <span className="text-sm text-green-600">Saved</span>
              )}
            </div>
          </section>
        )
      })}
    </main>
  )
}
