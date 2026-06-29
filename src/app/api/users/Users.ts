import { NextRequest } from 'next/server'
import { getDb } from '../../../lib/db'
const executeSql = getDb();

export async function GET(request: NextRequest) {
  const loginId = request.nextUrl.searchParams.get('loginId')

  try {
    if (loginId) {
      const [user] = await executeSql`
        SELECT id, first_name, last_name, login_id, role
        FROM users
        WHERE login_id = ${loginId}
      `
      if (!user) return Response.json({ error: 'User not found' }, { status: 404 })
      return Response.json(user)
    }

    const users = await executeSql`
      SELECT first_name, last_name, login_id, role
      FROM users
      ORDER BY role, last_name, first_name
    `
    return Response.json(users)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { firstName, lastName, loginId, role } = body

  for (const [key, val] of Object.entries({ firstName, lastName, loginId, role })) {
    if (!val) return Response.json({ error: `Missing required field: ${key}` }, { status: 400 })
  }

  const validRoles = ['active', 'inactive', 'admin']
  if (!validRoles.includes(role)) {
    return Response.json({ error: `Invalid role: ${role}` }, { status: 400 })
  }

  try {
    const [user] = await executeSql`
      INSERT INTO users (first_name, last_name, login_id, role)
      VALUES (${firstName}, ${lastName}, ${loginId}, ${role}::user_role)
      RETURNING id, first_name, last_name, login_id, role
    `
    return Response.json(user, { status: 201 })
  } catch (err: unknown) {
    const msg = String(err)
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return Response.json({ error: 'Login ID already taken' }, { status: 409 })
    }
    return Response.json({ error: msg }, { status: 500 })
  }
}
