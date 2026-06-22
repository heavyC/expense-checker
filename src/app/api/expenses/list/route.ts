import { NextRequest } from 'next/server'
import { executeSql } from '../../../../lib/db'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  const role = request.nextUrl.searchParams.get('role')

  try {
    const rows = role === 'admin'
      ? await executeSql`
          SELECT
            e.id, e.amount, e.category, e.vendor, e.description,
            e.charge_to_client, e.approved_by_manager, e.receipt_accuracy, e.submitted_at,
            CASE WHEN u.id IS NOT NULL THEN u.first_name || ' ' || u.last_name END AS approver_name,
            CASE WHEN c.id IS NOT NULL THEN c.first_name || ' ' || c.last_name END AS creator_name,
            a.verdict, a.reasoning, a.policy_citations, a.confidence, a.policy_excerpts, a.analyzed_at
          FROM expenses e
          LEFT JOIN expense_analyses a ON a.expense_id = e.id
          LEFT JOIN users u ON u.id = e.approved_by
          LEFT JOIN users c ON c.id = e.created_by
          ORDER BY e.submitted_at DESC
        `
      : await executeSql`
          SELECT
            e.id, e.amount, e.category, e.vendor, e.description,
            e.charge_to_client, e.approved_by_manager, e.receipt_accuracy, e.submitted_at,
            CASE WHEN u.id IS NOT NULL THEN u.first_name || ' ' || u.last_name END AS approver_name,
            CASE WHEN c.id IS NOT NULL THEN c.first_name || ' ' || c.last_name END AS creator_name,
            a.verdict, a.reasoning, a.policy_citations, a.confidence, a.policy_excerpts, a.analyzed_at
          FROM expenses e
          LEFT JOIN expense_analyses a ON a.expense_id = e.id
          LEFT JOIN users u ON u.id = e.approved_by
          LEFT JOIN users c ON c.id = e.created_by
          WHERE e.created_by = ${userId ? parseInt(userId) : -1}
          ORDER BY e.submitted_at DESC
        `

    return Response.json(rows)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
