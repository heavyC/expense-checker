import { NextRequest } from 'next/server'
import { executeSql } from '../../../../lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const [row] = await executeSql`
      SELECT id, amount, category, vendor, description, charge_to_client, created_by
      FROM expenses
      WHERE id = ${parseInt(id)}
    `
    if (!row) return Response.json({ error: 'Expense not found' }, { status: 404 })
    return Response.json(row)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const expenseId = parseInt(id)

  try {
    let row

    if ('manual_approval' in body) {
      if (typeof body.manual_approval !== 'boolean') {
        return Response.json({ error: 'manual_approval must be a boolean' }, { status: 400 })
      }
      const verdict = body.manual_approval ? 'APPROVED' : 'DENIED'
      const finalReviewBy = body.final_review_by != null ? parseInt(body.final_review_by) : null
      await executeSql`UPDATE expenses SET manual_approval = ${body.manual_approval}, final_review_by = ${finalReviewBy} WHERE id = ${expenseId}`
      ;[row] = await executeSql`
        UPDATE expense_analyses
        SET verdict = ${verdict}
        WHERE expense_id = ${expenseId}
        RETURNING id
      `
      if (!row) return Response.json({ error: 'No analysis found for this expense' }, { status: 404 })
      return Response.json({ success: true, verdict })
    } else if ('approved_by_manager' in body) {
      if (typeof body.approved_by_manager !== 'boolean') {
        return Response.json({ error: 'approved_by_manager must be a boolean' }, { status: 400 })
      }
      ;[row] = await executeSql`
        UPDATE expenses
        SET approved_by_manager = ${body.approved_by_manager}
        WHERE id = ${expenseId}
        RETURNING id, approved_by_manager
      `
    } else if ('approved_by' in body) {
      const approverId = body.approved_by === null ? null : parseInt(body.approved_by)
      if (approverId !== null) {
        const [user] = await executeSql`SELECT id FROM users WHERE id = ${approverId} AND role = 'admin'`
        if (!user) return Response.json({ error: 'Approver must be a user with admin role' }, { status: 400 })
      }
      ;[row] = await executeSql`
        UPDATE expenses
        SET approved_by = ${approverId}
        WHERE id = ${expenseId}
        RETURNING id, approved_by
      `
    } else if ('amount' in body) {
      // Full expense field update (edit page)
      const { amount, category, vendor, description, chargeToClient } = body
      ;[row] = await executeSql`
        UPDATE expenses
        SET amount = ${parseFloat(amount)},
            category = ${category},
            vendor = ${vendor},
            description = ${description},
            charge_to_client = ${chargeToClient}
        WHERE id = ${expenseId}
        RETURNING id
      `
    } else {
      return Response.json({ error: 'No recognized field to update' }, { status: 400 })
    }

    if (!row) return Response.json({ error: 'Expense not found' }, { status: 404 })
    return Response.json(row)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
