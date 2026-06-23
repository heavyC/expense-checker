'use client'

import { useEffect, useState } from 'react'
import { useUser } from '../components/UserContext'
import ExpandableAnalysis from './ExpandableAnalysis'

const verdictStyles = {
  APPROVED:     { badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',     label: 'Approved' },
  FLAGGED:      { badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',             label: 'Flagged' },
  MANUAL_REVIEW: { badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Manual Review Required' },
} as const

type Verdict = keyof typeof verdictStyles

interface ExpenseRow {
  id: number
  amount: string
  category: string
  vendor: string
  description: string | null
  charge_to_client: boolean
  approved_by_manager: boolean
  created_by: number
  approver_name: string | null
  creator_name: string | null
  receipt_accuracy: string | null
  submitted_at: string
  verdict: Verdict | null
  reasoning: string | null
  policy_citations: string[] | null
  confidence: string | null
  policy_excerpts: string[] | null
  analyzed_at: string | null
}

export default function ExpensesPage() {
  const { currentUser, loading: userLoading } = useUser()
  const [rows, setRows] = useState<ExpenseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({})
  const [visibleTypes, setVisibleTypes] = useState(new Set(['APPROVED', 'FLAGGED', 'MANUAL_REVIEW', 'PENDING']))

  const isInactive = currentUser?.role === 'inactive'
  const isAdmin = currentUser?.role === 'admin'

  function toggleType(type: string) {
    setVisibleTypes(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  async function submitToCompliance(id: number) {
    setSubmitting(prev => ({ ...prev, [id]: true }))
    await fetch('/api/batch-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expense_ids: [id] }),
    })
    const params = new URLSearchParams({ userId: String(currentUser!.id), role: currentUser!.role })
    const data = await fetch(`/api/expenses/list?${params}`).then(r => r.json())
    if (Array.isArray(data)) setRows(data)
    setSubmitting(prev => ({ ...prev, [id]: false }))
  }

  useEffect(() => {
    if (userLoading) return
    if (!currentUser) { setLoading(false); return }

    const params = new URLSearchParams({
      userId: String(currentUser.id),
      role: currentUser.role,
    })
    fetch(`/api/expenses/list?${params}`)
      .then(r => r.json())
      .then(data => setRows(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [currentUser, userLoading])

  if (userLoading || loading) {
    return (
      <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black">
        <main className="w-full max-w-4xl mx-auto py-12 px-6">
          <p className="text-sm text-zinc-500">Loading…</p>
        </main>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black">
        <main className="w-full max-w-4xl mx-auto py-12 px-6">
          <p className="text-sm text-zinc-500">Please log in to view expense reports.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-4xl mx-auto py-12 px-6 flex flex-col gap-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">
            Expense Reports
          </h1>
          {isInactive && (
            <span className="text-sm text-amber-600 dark:text-amber-400">Read-only — inactive account</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { key: 'APPROVED',      label: 'Approved',              on: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',   off: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500' },
            { key: 'FLAGGED',       label: 'Flagged',               on: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',           off: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500' },
            { key: 'MANUAL_REVIEW', label: 'Manual Review',         on: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', off: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500' },
            { key: 'PENDING',       label: 'Ready for Compliance',  on: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',       off: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500' },
          ].map(({ key, label, on, off }) => (
            <button
              key={key}
              onClick={() => toggleType(key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${visibleTypes.has(key) ? on : off}`}
            >
              {label}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No expenses submitted yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {rows.filter(row => visibleTypes.has(row.verdict ?? 'PENDING')).map((row) => {
              const style = row.verdict ? (verdictStyles[row.verdict as Verdict] ?? verdictStyles.MANUAL_REVIEW) : null
              const confidencePct = row.confidence ? Math.round(parseFloat(row.confidence) * 100) : null
              const accuracyPct = row.receipt_accuracy ? Math.round(parseFloat(row.receipt_accuracy) * 100) : null
              const isCreator = currentUser.id === row.created_by

              return (
                <div
                  key={row.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-base font-semibold text-black dark:text-white">
                        {row.vendor}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {new Date(row.submitted_at).toLocaleString()} · #{row.id}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-black dark:text-white tabular-nums shrink-0">
                      ${parseFloat(row.amount).toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    {row.creator_name && <Field label="Created By" value={row.creator_name} />}
                    <Field label="Category" value={row.category} />
                    <Field label="Charge to Client" value={row.charge_to_client ? 'Yes' : 'No'} />
                    <Field label="Approved by Manager" value={row.approved_by_manager ? 'Yes' : 'No'} />
                    {row.approver_name && <Field label="Approved By" value={row.approver_name} />}
                    {accuracyPct !== null && <Field label="Receipt Accuracy" value={`${accuracyPct}%`} />}
                    {row.description && <Field label="Description" value={row.description} className="col-span-2 sm:col-span-2" />}
                  </div>

                  {style && row.verdict ? (
                    <ExpandableAnalysis
                      reasoning={row.reasoning}
                      policyCitations={row.policy_citations}
                      policyExcerpts={row.policy_excerpts}
                      verdictBadge={style.badge}
                      verdictLabel={style.label}
                      confidencePct={confidencePct}
                      analyzedAt={row.analyzed_at}
                    />
                  ) : (
                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex items-center gap-3">
                      {isAdmin && !isCreator ? (
                        <button
                          onClick={() => submitToCompliance(row.id)}
                          disabled={submitting[row.id]}
                          className="rounded-full px-3 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 transition-colors"
                        >
                          {submitting[row.id] ? 'Processing…' : 'Ready for Compliance'}
                        </button>
                      ) : isAdmin && isCreator ? (
                        <span
                          title="Admins cannot submit their own reports"
                          className="rounded-full px-3 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed"
                        >
                          Ready for Compliance
                        </span>
                      ) : (
                        <span className="rounded-full px-3 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Ready for Compliance
                        </span>
                      )}
                      {isCreator && !isInactive && (
                        <a
                          href={`/expenses/${row.id}/edit`}
                          className="rounded-full px-3 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        >
                          Edit
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function Field({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-xs text-zinc-400">{label}</span>
      <span className="text-sm text-zinc-700 dark:text-zinc-300">{value}</span>
    </div>
  )
}
