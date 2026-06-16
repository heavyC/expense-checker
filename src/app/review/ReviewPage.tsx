'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface PendingExpense {
  id: number
  amount: string
  category: string
  vendor: string
  description: string | null
  charge_to_client: boolean
  submitted_at: string
}

export default function ReviewPage({ expenses }: { expenses: PendingExpense[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(expenses.map((e) => e.id)) : new Set())
  }

  function toggleOne(id: number, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selected.size === 0) return

    setStatus('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/batch-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expense_ids: Array.from(selected) }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('done')
        router.refresh()
      } else {
        setStatus('error')
        setErrorMessage(data.error ?? 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network error. Please try again.')
    }
  }

  if (expenses.length === 0) {
    return <p className="text-sm text-zinc-500">No expenses are waiting for review.</p>
  }

  const allSelected = selected.size === expenses.length
  const submitting = status === 'submitting'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Select-all + submit bar */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => toggleAll(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 accent-black dark:accent-white"
          />
          Select all ({expenses.length})
        </label>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <span className="text-xs text-zinc-400">{selected.size} selected</span>
          )}
          <button
            type="submit"
            disabled={selected.size === 0 || submitting}
            className="rounded bg-black text-white px-4 py-1.5 text-sm font-semibold hover:bg-zinc-800 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {submitting ? 'Sending to compliance…' : 'Send to Compliance Agent'}
          </button>
        </div>
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}

      {/* Expense list */}
      <div className="flex flex-col gap-2">
        {expenses.map((exp) => (
          <label
            key={exp.id}
            className="flex items-start gap-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-4 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.has(exp.id)}
              onChange={(e) => toggleOne(exp.id, e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-black dark:accent-white"
            />
            <div className="flex flex-1 flex-col gap-1 min-w-0">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-semibold text-black dark:text-white truncate">{exp.vendor}</span>
                <span className="text-sm font-semibold text-black dark:text-white tabular-nums shrink-0">
                  ${parseFloat(exp.amount).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <span className="capitalize">{exp.category}</span>
                <span>·</span>
                <span>{exp.charge_to_client ? 'Client charge' : 'Internal'}</span>
                <span>·</span>
                <span>#{exp.id}</span>
                <span>·</span>
                <span>{new Date(exp.submitted_at).toLocaleString()}</span>
              </div>
              {exp.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{exp.description}</p>
              )}
            </div>
            <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Ready for Review
            </span>
          </label>
        ))}
      </div>
    </form>
  )
}
