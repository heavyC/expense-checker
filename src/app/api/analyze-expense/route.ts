import { NextRequest } from 'next/server'
import { spawn } from 'child_process'
import { join } from 'path'

export async function POST(request: NextRequest) {
  const expense = await request.json()

  const required = ['amount', 'category', 'vendor', 'description', 'chargeToCustomer']
  for (const field of required) {
    if (expense[field] === undefined || expense[field] === '') {
      return Response.json({ error: `Missing required field: ${field}` }, { status: 400 })
    }
  }

  try {
    const result = await runPython(expense)
    return Response.json({ success: true, result })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

function runPython(expense: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = join(process.cwd(), 'src', 'scripts', 'compliance.py')
    const proc = spawn('python3', ['-c', `
import sys, json
sys.path.insert(0, '${join(process.cwd(), 'src', 'scripts')}')
from compliance import analyzeExpense
expense = json.loads(sys.stdin.read())
print(analyzeExpense(expense))
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
