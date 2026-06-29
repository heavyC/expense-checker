import { NextRequest } from 'next/server'
import { spawn } from 'child_process'
import { join } from 'path'
// import { executeSql } from '../../../lib/db'
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

  try {
    const [promptRow] = await executeSql`
      SELECT body FROM prompts WHERE name = 'compliance_analysis' AND is_active = TRUE
    `
    if (promptRow) expense._prompt = promptRow.body

    const raw = await runPython(expense)
    let result: Record<string, unknown>
    try {
      result = JSON.parse(raw)
    } catch {
      return Response.json({ error: 'Failed to parse analysis output' }, { status: 500 })
    }

    let expenseId: number = expense.expense_id as number
    if (!expenseId) {
      const [row] = await executeSql`
        INSERT INTO expenses (amount, category, vendor, description, charge_to_client)
        VALUES (${expense.amount}, ${expense.category}, ${expense.vendor},
                ${expense.description}, ${expense.chargeToClient})
        RETURNING id
      `
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

export function runPython(expense: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', ['-c', `
import sys, json
sys.path.insert(0, '${join(process.cwd(), 'src', 'scripts')}')
from compliance import analyzeExpense
expense = json.loads(sys.stdin.read())
print(json.dumps(analyzeExpense(expense)))
`])

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
    proc.stdin.write(JSON.stringify(expense))
    proc.stdin.end()

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim())
      } else {
        reject(stderr.trim() || `Process exited with code ${code}`)
      }
    })
  })
}
