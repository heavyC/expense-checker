import { NextRequest } from 'next/server'
import { getDb } from '../../../lib/db'

export async function GET(request: NextRequest) {
  console.error("*** Users GET")

  const loginId = request.nextUrl.searchParams.get('loginId')

  try {
    console.error('**** Request URL:', request.url)
    console.error('**** ENV CHECK DATABASE_URL:', process.env.DATABASE_URL ? 'SET (' + process.env.DATABASE_URL.substring(0, 40) + '...)' : 'MISSING')
    console.error('**** ENV CHECK ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'SET (' + process.env.ANTHROPIC_API_KEY.substring(0, 20) + '...)' : 'MISSING')

    const executeSql = getDb();

    if (loginId) {
      const [user] = await executeSql`
        SELECT id, first_name, last_name, login_id, role
        FROM users
        WHERE login_id = ${loginId}
      ` as unknown as Record<string, any>[]

      if (!user) return Response.json({ error: 'User not found' }, { status: 404 })
      return Response.json(user)
    }

    const users = await executeSql`
      SELECT first_name, last_name, login_id, role
      FROM users
      ORDER BY role, last_name, first_name
    ` as unknown as Record<string, any>[]
    
    return Response.json(users)
  } catch (error) {
    console.error("ERROR in Users API: ", error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.error("*** Users POST")

  const executeSql = getDb();
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
    ` as unknown as Record<string, any>[]

    return Response.json(user, { status: 201 })
  } catch (err: unknown) {
    const msg = String(err)
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return Response.json({ error: 'Login ID already taken' }, { status: 409 })
    }
    return Response.json({ error: msg }, { status: 500 })
  }
}
