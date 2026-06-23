import { executeSql } from '../../lib/db'

export default async function CompletedPage() {
  const expenses = await executeSql`
    SELECT e.id, e.amount, e.category, e.vendor, e.description,
           e.charge_to_client, e.approved_by_manager, e.submitted_at,
           u.first_name || ' ' || u.last_name AS creator_name,
           ap.first_name || ' ' || ap.last_name AS approver_name,
           fr.first_name || ' ' || fr.last_name AS final_reviewer_name,
           a.reasoning, a.policy_citations, a.confidence, a.analyzed_at, a.verdict
    FROM expenses e
    JOIN expense_analyses a ON a.expense_id = e.id
    LEFT JOIN users u ON u.id = e.created_by
    LEFT JOIN users ap ON ap.id = e.approved_by
    LEFT JOIN users fr ON fr.id = e.final_review_by
    WHERE a.verdict IN ('APPROVED', 'DENIED')
    ORDER BY a.analyzed_at DESC
  `

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-4xl mx-auto py-12 px-6 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">
            Completed
          </h1>
          <p className="text-sm text-zinc-500">
            Approved expense reports.
          </p>
        </div>

        {expenses.length === 0 ? (
          <p className="text-sm text-zinc-500">No approved expenses yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(expenses as any[]).map((exp) => {
              const confidencePct = exp.confidence ? Math.round(parseFloat(exp.confidence) * 100) : null
              return (
                <div
                  key={exp.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-4 flex flex-col gap-2"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm font-semibold text-black dark:text-white">{exp.vendor}</span>
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
                    <span>Submitted {new Date(exp.submitted_at).toLocaleString()}</span>
                    {exp.creator_name && (
                      <>
                        <span>·</span>
                        <span>by {exp.creator_name}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                    {exp.analyzed_at && (
                      <span>Approved {new Date(exp.analyzed_at).toLocaleString()}</span>
                    )}
                    {exp.approver_name && (
                      <>
                        <span>·</span>
                        <span>Reviewed by {exp.approver_name}</span>
                      </>
                    )}
                    {exp.final_reviewer_name && (
                      <>
                        <span>·</span>
                        <span>Final review by {exp.final_reviewer_name}</span>
                      </>
                    )}
                    {exp.approved_by_manager && (
                      <>
                        <span>·</span>
                        <span className="text-green-600 dark:text-green-400">Manager approved</span>
                      </>
                    )}
                    {confidencePct !== null && (
                      <>
                        <span>·</span>
                        <span>{confidencePct}% confidence</span>
                      </>
                    )}
                  </div>
                  {exp.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{exp.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {exp.verdict === 'APPROVED' ? (
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Approved
                      </span>
                    ) : (
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Denied
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
