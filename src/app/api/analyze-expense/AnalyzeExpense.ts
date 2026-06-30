import { NextRequest } from 'next/server'
import { getDb } from '../../../lib/db'
import { analyzeExpense } from '../../../lib/compliance'

const executeSql = getDb();

export async function POST(request: NextRequest) {
  const expense = await request.json()

  const required = ['amount', 'category', 'vendor', 'description', 'chargeToClient']
  for (const field of required) {
    if (expense[field] === undefined || expense[field] === '') {
      return Response.json({ error: `Missing required field: ${field}` }, { status: 400 })
    }
  }

  try {
    const [promptRow] = await executeSql`
      SELECT body FROM prompts WHERE name = 'compliance_analysis' AND is_active = TRUE
    ` as unknown as Record<string, any>[]
    if (promptRow) expense._prompt = promptRow.body

    const result = await analyzeExpense(expense)

    let expenseId: number = expense.expense_id as number
    if (!expenseId) {
      const [row] = await executeSql`
        INSERT INTO expenses (amount, category, vendor, description, charge_to_client)
        VALUES (${expense.amount}, ${expense.category}, ${expense.vendor},
                ${expense.description}, ${expense.chargeToClient})
        RETURNING id
      ` as unknown as Record<string, any>[]
      expenseId = row.id
    }

    await executeSql`
      INSERT INTO expense_analyses
        (expense_id, verdict, reasoning, policy_citations, confidence, policy_excerpts, model)
      VALUES (
        ${expenseId},
        ${result.verdict},
        ${result.reasoning},
        ${JSON.stringify(result.policy_citations ?? [])},
        ${result.confidence},
        ${JSON.stringify(result.policy_excerpts ?? [])},
        'claude-opus-4-8'
      )
    `

    return Response.json({ success: true, result })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
