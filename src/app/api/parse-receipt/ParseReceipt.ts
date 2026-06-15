import { NextRequest } from 'next/server'
import { spawn } from 'child_process'
import { join } from 'path'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { executeSql } from '../../../lib/db'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('receipt') as File | null

  if (!file) {
    return Response.json({ error: 'No receipt image provided' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: 'Unsupported image type. Use JPEG, PNG, GIF, or WebP.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const tmpPath = join(tmpdir(), `receipt-${Date.now()}.${ext}`)

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(tmpPath, buffer)

    const raw = await runPython(tmpPath)
    const result = JSON.parse(raw)

    const [row] = await executeSql`
      INSERT INTO expenses (amount, category, vendor, description, charge_to_client, receipt_accuracy)
      VALUES (${result.amount}, ${result.category}, ${result.vendor},
              ${result.description}, ${result.chargeToClient}, ${result.accuracy})
      RETURNING id
    `

    return Response.json({ success: true, result, fileName: file.name, expense_id: row.id })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  } finally {
    unlink(tmpPath).catch(() => {})
  }
}

export function runPython(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', ['-c', `
import sys, json
sys.path.insert(0, '${join(process.cwd(), 'src', 'scripts')}')
from parse_receipt import parse_receipt
payload = json.loads(sys.stdin.read())
print(json.dumps(parse_receipt(payload['image_path'])))
`])

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
    proc.stdin.write(JSON.stringify({ image_path: imagePath }))
    proc.stdin.end()

    proc.on('close', (code) => {
      if (code === 0) resolve(stdout.trim())
      else reject(stderr.trim() || `Process exited with code ${code}`)
    })
  })
}
