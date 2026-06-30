import { NextRequest } from 'next/server'
import { getDb } from '../../../lib/db'
import { parseReceipt } from '../../../lib/parseReceipt'

const executeSql = getDb();

type AllowedMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
const ALLOWED_TYPES: AllowedMediaType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('receipt') as File | null
  const createdBy = formData.get('created_by') ? parseInt(formData.get('created_by') as string) : null

    console.error('**** ParseReceipt Request URL:', request.url)
    console.error('**** ParseReceipt ENV CHECK DATABASE_URL:', process.env.DATABASE_URL ? 'SET (' + process.env.DATABASE_URL.substring(0, 40) + '...)' : 'MISSING')
    console.error('**** ParseReceipt ENV CHECK ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'SET (' + process.env.ANTHROPIC_API_KEY.substring(0, 20) + '...)' : 'MISSING')
    console.error('**** ParseReceipt ENV CHECK CHROMA_API_KEY:', process.env.CHROMA_API_KEY ? 'SET (' + process.env.CHROMA_API_KEY.substring(0, 20) + '...)' : 'MISSING')



  if (!file) {
    return Response.json({ error: 'No receipt image provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type as AllowedMediaType)) {
    return Response.json({ error: 'Unsupported image type. Use JPEG, PNG, GIF, or WebP.' }, { status: 400 })
  }

  if (createdBy) {
    const [user] = await executeSql`SELECT role FROM users WHERE id = ${createdBy}` as unknown as Record<string, any>[]
    if (!user) return Response.json({ error: 'User not found' }, { status: 400 })
    if (user.role === 'inactive') return Response.json({ error: 'Inactive users cannot create expense reports' }, { status: 403 })
  }

  let result: any = null;
  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    const [promptRow] = await executeSql`
      SELECT body FROM prompts WHERE name = 'receipt_parsing' AND is_active = TRUE
    ` as unknown as Record<string, any>[]
    const prompt = promptRow?.body ?? null

    result = await parseReceipt(buffer, file.type as AllowedMediaType, prompt)
  } catch (err) {
    console.error("*** ERROR1 in ParseReceipts: ", err)
    return Response.json({ error: String(err) }, { status: 500 })
  }

  try {
    const [row] = await executeSql`
      INSERT INTO expenses (amount, category, vendor, description, charge_to_client, receipt_accuracy, created_by)
      VALUES (${result.amount}, ${result.category}, ${result.vendor},
              ${result.description}, ${result.chargeToClient}, ${result.accuracy}, ${createdBy})
      RETURNING id
    ` as unknown as Record<string, any>[]

    return Response.json({ success: true, result, fileName: file.name, expense_id: row.id })
  } catch (err) {
    console.error("*** ERROR2 in ParseReceipts: ", err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
