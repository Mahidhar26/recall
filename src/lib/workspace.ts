import { pool } from './db'

export interface Workspace {
  id: string
  name: string
  plan: string
}

// Returns the user's workspace, creating a personal one on first use. Used by
// the JWT callback (lazily, e.g. for first-time Google sign-ins) and the
// email-signup route. Pure DB access — no NextAuth import (avoids a cycle with
// auth.ts, which imports this).
export async function getOrCreateWorkspace(userId: string): Promise<Workspace> {
  const existing = await pool.query(
    'SELECT id, name, plan FROM workspaces WHERE owner_id = $1 ORDER BY created_at ASC LIMIT 1',
    [userId]
  )
  if (existing.rows.length) return existing.rows[0]

  const { rows: userRows } = await pool.query(
    'SELECT name, email FROM users WHERE id = $1',
    [userId]
  )
  const label =
    userRows[0]?.name ?? userRows[0]?.email?.split('@')[0] ?? 'My'

  const { rows } = await pool.query(
    `INSERT INTO workspaces (name, owner_id, plan)
     VALUES ($1, $2, 'free') RETURNING id, name, plan`,
    [`${label}'s workspace`, userId]
  )
  return rows[0]
}
