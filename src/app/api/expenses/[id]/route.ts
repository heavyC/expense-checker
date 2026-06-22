import { NextRequest } from 'next/server'
import { executeSql } from '../../../../lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const expenseId = parseInt(id)

  try {
    let row

    if ('approved_by_manager' in body) {
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
        const [user] = await executeSql`
          SELECT id FROM users WHERE id = ${approverId} AND role = 'admin'
        `
        if (!user) {
          return Response.json({ error: 'Approver must be a user with admin role' }, { status: 400 })
        }
      }

      ;[row] = await executeSql`
        UPDATE expenses
        SET approved_by = ${approverId}
        WHERE id = ${expenseId}
        RETURNING id, approved_by
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
