import { NextRequest } from 'next/server'
import { listPolicies } from '../../../lib/listPolicies'

export async function GET(_req: NextRequest) {
  try {
    const data = await listPolicies()
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
