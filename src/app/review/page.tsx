import ReviewPage from './ReviewPage'
import { getDb } from '../../lib/db'
import { unstable_noStore as noStore } from 'next/cache'

const executeSql = getDb();

export default async function Review() {
  noStore() // block caching

  const [expenses, adminUsers] = await Promise.all([
    executeSql`
      SELECT e.id, e.amount, e.category, e.vendor, e.description,
             e.charge_to_client, e.approved_by_manager, e.approved_by, e.submitted_at,
             e.created_by, u.first_name || ' ' || u.last_name AS creator_name
      FROM expenses e
      LEFT JOIN expense_analyses a ON a.expense_id = e.id
      LEFT JOIN users u ON u.id = e.created_by
      WHERE a.id IS NULL
      ORDER BY e.submitted_at DESC
    ` as unknown as Record<string, any>[],
    executeSql`
      SELECT id, first_name, last_name FROM users WHERE role = 'admin' ORDER BY last_name, first_name
    ` as unknown as Record<string, any>[],
  ])

console.error("*** ReviewPage.page.tsx expenses:  ", expenses)
console.error("*** ReviewPage.page.tsx adminUsers:  ", adminUsers)


  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-4xl mx-auto py-12 px-6 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">
            xReady for Compliance Check
          </h1>
          <p className="text-sm text-zinc-500">
            Expenses waiting for compliance analysis. Select the ones you want to submit.
          </p>
        </div>
        <ReviewPage expenses={expenses as any} adminUsers={adminUsers as any} />
      </main>
    </div>
  )
}
