import { NextRequest } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { spawn } from 'child_process'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const tmpPath = join(tmpdir(), `policy-${Date.now()}.txt`)

  await writeFile(tmpPath, buffer)

  try {
    const result = await runPython(tmpPath)
    return Response.json({ success: true, message: result })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  } finally {
    await unlink(tmpPath).catch(() => {})
  }
}

export function runPython(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = join(process.cwd(), 'src', 'scripts', 'ingest-policy.py')
    const proc = spawn('python3', [scriptPath, filePath])

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim())
      } else {
        reject(stderr.trim() || `Process exited with code ${code}`)
      }
    })
  })
}
