import { NextRequest } from 'next/server'
import { getDb } from '../../../lib/db'
const executeSql = getDb();

export async function GET() {
  try {
    const rows = await executeSql`
      SELECT id, name, body, description, version, updated_at
      FROM prompts
      WHERE is_active = TRUE
      ORDER BY name
    `
    return Response.json(rows)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { name, body } = await request.json()
  if (!name || !body) {
    return Response.json({ error: 'name and body are required' }, { status: 400 })
  }

  try {
    const [row] = await executeSql`
      UPDATE prompts
      SET body = ${body}, version = version + 1, updated_at = NOW()
      WHERE name = ${name} AND is_active = TRUE
      RETURNING id, name, body, description, version, updated_at
    ` as unknown as Record<string, any>[]
    
    if (!row) return Response.json({ error: 'Prompt not found' }, { status: 404 })
    return Response.json(row)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
