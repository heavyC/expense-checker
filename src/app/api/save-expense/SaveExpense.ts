import { NextRequest } from 'next/server'
import { getDb } from '../../../lib/db'
const executeSql = getDb();

export async function POST(request: NextRequest) {
  const expense = await request.json()

  const required = ['amount', 'category', 'vendor', 'description', 'chargeToClient']
  for (const field of required) {
    if (expense[field] === undefined || expense[field] === '') {
      return Response.json({ error: `Missing required field: ${field}` }, { status: 400 })
    }
  }

  const createdBy: number | null = expense.created_by ? parseInt(expense.created_by) : null

  if (createdBy) {
    const [user] = await executeSql`SELECT role FROM users WHERE id = ${createdBy}`
    if (!user) return Response.json({ error: 'User not found' }, { status: 400 })
    if (user.role === 'inactive') return Response.json({ error: 'Inactive users cannot create expense reports' }, { status: 403 })
  }

  try {
    // Receipt already created the expense row — update all fields including created_by
    if (expense.expense_id) {
      await executeSql`
        UPDATE expenses
        SET amount          = ${expense.amount},
            category        = ${expense.category},
            vendor          = ${expense.vendor},
            description     = ${expense.description},
            charge_to_client = ${expense.chargeToClient},
            created_by      = ${createdBy}
        WHERE id = ${expense.expense_id}
      `
      return Response.json({ success: true, expense_id: expense.expense_id })
    }

    const [row] = await executeSql`
      INSERT INTO expenses (amount, category, vendor, description, charge_to_client, created_by)
      VALUES (${expense.amount}, ${expense.category}, ${expense.vendor},
              ${expense.description}, ${expense.chargeToClient}, ${createdBy})
      RETURNING id
    `
    return Response.json({ success: true, expense_id: row.id })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
