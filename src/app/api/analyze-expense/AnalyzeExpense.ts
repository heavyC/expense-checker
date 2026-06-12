import { NextRequest } from 'next/server'
import { spawn } from 'child_process'
import { join } from 'path'

export async function POST(request: NextRequest) {
  const expense = await request.json()

  const required = ['amount', 'category', 'vendor', 'description', 'chargeToClient']
  for (const field of required) {
    if (expense[field] === undefined || expense[field] === '') {
      return Response.json({ error: `Missing required field: ${field}` }, { status: 400 })
    }
  }

  try {
    const raw = await runPython(expense)
    let result: unknown
    try {
      result = JSON.parse(raw)
    } catch {
      result = raw
    }
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
