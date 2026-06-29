// import { executeSql } from '../../lib/db'
import ManualReviewPage from './ManualReviewPage'
import { getDb } from '../../lib/db'
const executeSql = getDb();

export default async function ManualReview() {
  const expenses = await executeSql`
    SELECT e.id, e.amount, e.category, e.vendor, e.description,
           e.charge_to_client, e.submitted_at, e.created_by,
           u.first_name || ' ' || u.last_name AS creator_name,
           a.reasoning, a.policy_citations, a.confidence
    FROM expenses e
    JOIN expense_analyses a ON a.expense_id = e.id
    LEFT JOIN users u ON u.id = e.created_by
    WHERE a.verdict = 'FLAGGED'
    ORDER BY a.analyzed_at DESC
  `

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-4xl mx-auto py-12 px-6 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">
            Needs Manual Review
          </h1>
          <p className="text-sm text-zinc-500">
            Flagged expenses requiring human review. Select reports to resubmit to the compliance agent.
          </p>
        </div>
        <ManualReviewPage expenses={expenses as any} />
      </main>
    </div>
  )
}
