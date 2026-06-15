import { executeSql } from '../../lib/db'

const verdictStyles = {
  APPROVED:     { badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',     label: 'Approved' },
  FLAGGED:      { badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',             label: 'Flagged' },
  NEEDS_REVIEW: { badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Needs Review' },
} as const

type Verdict = keyof typeof verdictStyles

interface ExpenseRow {
  id: number
  amount: string
  category: string
  vendor: string
  description: string | null
  charge_to_client: boolean
  receipt_accuracy: string | null
  submitted_at: string
  verdict: Verdict | null
  reasoning: string | null
  policy_citations: string[] | null
  confidence: string | null
  policy_excerpts: string[] | null
  analyzed_at: string | null
}

export default async function ExpensesPage() {
  const rows = await executeSql`
    SELECT
      e.id,
      e.amount,
      e.category,
      e.vendor,
      e.description,
      e.charge_to_client,
      e.receipt_accuracy,
      e.submitted_at,
      a.verdict,
      a.reasoning,
      a.policy_citations,
      a.confidence,
      a.policy_excerpts,
      a.analyzed_at
    FROM expenses e
    LEFT JOIN expense_analyses a ON a.expense_id = e.id
    ORDER BY e.submitted_at DESC
  `

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-4xl mx-auto py-12 px-6 flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">
          Expense Reports
        </h1>

        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No expenses submitted yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {rows.map((row) => {
              const style = row.verdict ? (verdictStyles[row.verdict as Verdict] ?? verdictStyles.NEEDS_REVIEW) : null
              const confidencePct = row.confidence ? Math.round(parseFloat(row.confidence) * 100) : null
              const accuracyPct = row.receipt_accuracy ? Math.round(parseFloat(row.receipt_accuracy) * 100) : null

              return (
                <div
                  key={row.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-4"
                >
                  {/* Header row */}
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

                  {/* Expense details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <Field label="Category" value={row.category} />
                    <Field label="Charge to Client" value={row.charge_to_client ? 'Yes' : 'No'} />
                    {accuracyPct !== null && <Field label="Receipt Accuracy" value={`${accuracyPct}%`} />}
                    {row.description && <Field label="Description" value={row.description} className="col-span-2 sm:col-span-2" />}
                  </div>

                  {/* Analysis */}
                  {style && row.verdict ? (
                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${style.badge}`}>
                          {style.label}
                        </span>
                        {confidencePct !== null && (
                          <span className="text-xs text-zinc-400">{confidencePct}% confidence</span>
                        )}
                        {row.analyzed_at && (
                          <span className="text-xs text-zinc-400 ml-auto">
                            Analyzed {new Date(row.analyzed_at).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {row.reasoning && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {row.reasoning}
                        </p>
                      )}

                      {row.policy_citations && row.policy_citations.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Policy Citations</p>
                          <ul className="flex flex-col gap-1">
                            {row.policy_citations.map((citation: string, index: number) => (
                              <li key={index} className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                                {citation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {row.policy_excerpts && row.policy_excerpts.length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer font-semibold text-zinc-400 select-none">
                            Policy excerpts used ({row.policy_excerpts.length})
                          </summary>
                          <ul className="mt-2 flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-700 pl-3">
                            {row.policy_excerpts.map((excerpt: string, index: number) => (
                              <li key={index} className="text-zinc-500 leading-relaxed">{excerpt}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                      No analysis yet
                    </p>
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
