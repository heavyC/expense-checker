import { executeSql } from '../../lib/db'
import ReviewPage from './ReviewPage'

export default async function Review() {
  const expenses = await executeSql`
    SELECT e.id, e.amount, e.category, e.vendor, e.description,
           e.charge_to_client, e.submitted_at
    FROM expenses e
    LEFT JOIN expense_analyses a ON a.expense_id = e.id
    WHERE a.id IS NULL
    ORDER BY e.submitted_at DESC
  `

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-4xl mx-auto py-12 px-6 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">
            Review
          </h1>
          <p className="text-sm text-zinc-500">
            Expenses waiting for compliance analysis. Select the ones you want to submit.
          </p>
        </div>
        <ReviewPage expenses={expenses as any} />
      </main>
    </div>
  )
}
