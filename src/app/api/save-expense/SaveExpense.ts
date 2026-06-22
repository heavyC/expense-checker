import { NextRequest } from 'next/server'
import { executeSql } from '../../../lib/db'

export async function POST(request: NextRequest) {
  const expense = await request.json()

  const required = ['amount', 'category', 'vendor', 'description', 'chargeToClient']
  for (const field of required) {
    if (expense[field] === undefined || expense[field] === '') {
      return Response.json({ error: `Missing required field: ${field}` }, { status: 400 })
    }
  }

  try {
    // If a receipt was already parsed and saved, expense_id is already in DB — nothing to insert
    if (expense.expense_id) {
      return Response.json({ success: true, expense_id: expense.expense_id })
    }

    const [row] = await executeSql`
      INSERT INTO expenses (amount, category, vendor, description, charge_to_client)
      VALUES (${expense.amount}, ${expense.category}, ${expense.vendor},
              ${expense.description}, ${expense.chargeToClient})
      RETURNING id
    `
    return Response.json({ success: true, expense_id: row.id })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
