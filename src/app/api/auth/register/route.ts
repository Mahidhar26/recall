import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { pool } from '@/lib/db'
import { getOrCreateWorkspace } from '@/lib/workspace'

// Email/password signup. Hashes the password, creates the user + a personal
// workspace. The client signs in with the credentials provider afterwards.
export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const normalized = String(email).toLowerCase().trim()
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalized])
    if (existing.rows.length) {
      return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3) RETURNING id`,
      [name?.trim() || null, normalized, passwordHash]
    )

    await getOrCreateWorkspace(rows[0].id)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Could not create account' }, { status: 500 })
  }
}
