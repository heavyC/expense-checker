import { NextRequest } from 'next/server'
import { join } from 'path'
import { spawn } from 'child_process'

export function runPython(): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = join(process.cwd(), 'src', 'scripts', 'list_policies.py')
    const proc = spawn('python3', [scriptPath])

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })

    proc.on('close', (code) => {
      if (code === 0) resolve(stdout.trim())
      else reject(stderr.trim() || `Process exited with code ${code}`)
    })
  })
}

export async function GET(_req: NextRequest) {
  try {
    const raw = await runPython()
    const data = JSON.parse(raw)
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
