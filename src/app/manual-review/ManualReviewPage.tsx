'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface FlaggedExpense {
  id: number
  amount: string
  category: string
  vendor: string
  description: string | null
  charge_to_client: boolean
  submitted_at: string
  creator_name: string | null
  reasoning: string | null
  policy_citations: string[] | null
  confidence: string | null
}

export default function ManualReviewPage({ expenses }: { expenses: FlaggedExpense[] }) {
  const router = useRouter()
  const [acting, setActing] = useState<Record<number, boolean>>({})
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  function toggleExpanded(id: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function decide(id: number, approved: boolean) {
    setActing(prev => ({ ...prev, [id]: true }))
    await fetch(`/api/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manual_approval: approved }),
    })
    setActing(prev => ({ ...prev, [id]: false }))
    router.refresh()
  }

  if (expenses.length === 0) {
    return <p className="text-sm text-zinc-500">No flagged expenses requiring manual review.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {expenses.map((exp) => {
        const isActing = acting[exp.id]
        const isExpanded = expanded.has(exp.id)
        const confidencePct = exp.confidence ? Math.round(parseFloat(exp.confidence) * 100) : null

        return (
          <div
            key={exp.id}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          >
            <div className="flex items-start gap-4 px-4 py-4">
              <div className="flex flex-1 flex-col gap-1 min-w-0">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm font-semibold text-black dark:text-white truncate">{exp.vendor}</span>
                  <span className="text-sm font-semibold text-black dark:text-white tabular-nums shrink-0">
                    ${parseFloat(exp.amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  <span className="capitalize">{exp.category}</span>
                  <span>·</span>
                  <span>{exp.charge_to_client ? 'Client charge' : 'Internal'}</span>
                  <span>·</span>
                  <span>#{exp.id}</span>
                  <span>·</span>
                  <span>{new Date(exp.submitted_at).toLocaleString()}</span>
                  {exp.creator_name && (
                    <>
                      <span>·</span>
                      <span>Submitted by {exp.creator_name}</span>
                    </>
                  )}
                </div>
                {exp.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{exp.description}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  Flagged for Manual Review
                </span>
                {confidencePct !== null && (
                  <span className="text-xs text-zinc-400">{confidencePct}% confidence</span>
                )}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => decide(exp.id, true)}
                    disabled={isActing}
                    className="rounded px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 disabled:opacity-50 transition-colors"
                  >
                    {isActing ? '…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => decide(exp.id, false)}
                    disabled={isActing}
                    className="rounded px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 disabled:opacity-50 transition-colors"
                  >
                    {isActing ? '…' : 'Deny'}
                  </button>
                </div>
              </div>
            </div>

            {(exp.reasoning || (exp.policy_citations && exp.policy_citations.length > 0)) && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 pb-3">
                <button
                  type="button"
                  onClick={() => toggleExpanded(exp.id)}
                  className="mt-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {isExpanded ? 'Hide analysis ▲' : 'Show analysis ▼'}
                </button>
                {isExpanded && (
                  <div className="mt-3 flex flex-col gap-3">
                    {exp.reasoning && (
                      <div>
                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Reasoning</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{exp.reasoning}</p>
                      </div>
                    )}
                    {exp.policy_citations && exp.policy_citations.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Policy Citations</p>
                        <ul className="flex flex-col gap-1">
                          {exp.policy_citations.map((c, i) => (
                            <li key={i} className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
