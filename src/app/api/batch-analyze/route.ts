import { NextRequest } from 'next/server'
import { analyzeExpense } from '../../../lib/compliance'
import { getDb } from '../../../lib/db'

const executeSql = getDb();

export async function POST(request: NextRequest) {
  const { expense_ids } = await request.json() as { expense_ids: number[] }

  if (!Array.isArray(expense_ids) || expense_ids.length === 0) {
    return Response.json({ error: 'expense_ids must be a non-empty array' }, { status: 400 })
  }

  const results: { expense_id: number; success: boolean; error?: string }[] = []

  for (const expense_id of expense_ids) {
    try {
      const rows = await executeSql`
        SELECT id, amount, category, vendor, description, charge_to_client, approved_by_manager
        FROM expenses
        WHERE id = ${expense_id}
      ` as unknown as Record<string, any>[]

      if (rows.length === 0) {
        results.push({ expense_id, success: false, error: 'Expense not found' })
        continue
      }

      const row = rows[0]
      const expense = {
        amount: parseFloat(row.amount),
        category: row.category,
        vendor: row.vendor,
        description: row.description,
        chargeToClient: row.charge_to_client,
        approvedByManager: row.approved_by_manager,
      }

      const result = await analyzeExpense(expense)

      await executeSql`
        INSERT INTO expense_analyses
          (expense_id, verdict, reasoning, policy_citations, confidence, policy_excerpts, model)
        VALUES (
          ${expense_id},
          ${result.verdict},
          ${result.reasoning},
          ${JSON.stringify(result.policy_citations ?? [])},
          ${result.confidence},
          ${JSON.stringify(result.policy_excerpts ?? [])},
          'claude-opus-4-8'
        )
      `

      results.push({ expense_id, success: true })
    } catch (err) {
      results.push({ expense_id, success: false, error: String(err) })
    }
  }

  return Response.json({ results })
}
