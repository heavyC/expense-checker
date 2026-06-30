import { NextRequest } from 'next/server'
import { uploadExpensePolicy } from '../../../lib/uploadPolicy'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  try {
    const content = await file.text()
    const { success, message } = await uploadExpensePolicy(content, file.name)

    if (!success) {
      return Response.json({ error: message }, { status: 400 })
    }
    return Response.json({ success: true, message })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
