import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { requireWorkspace } from '@/lib/session'

// Load a session's filters + full message history (to restore a past chat).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = await requireWorkspace()
  if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const sessionRes = await pool.query(
    `SELECT id, title, filters FROM chat_sessions WHERE id = $1 AND workspace_id = $2`,
    [id, scope.workspaceId]
  )
  if (!sessionRes.rows.length) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const messages = await pool.query(
    `SELECT role, content, sources, filters FROM chat_messages
     WHERE session_id = $1 ORDER BY created_at ASC`,
    [id]
  )

  return NextResponse.json({
    session: sessionRes.rows[0],
    messages: messages.rows,
  })
}

// Delete a session (and its messages, via ON DELETE CASCADE).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = await requireWorkspace()
  if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const { rowCount } = await pool.query(
    `DELETE FROM chat_sessions WHERE id = $1 AND workspace_id = $2`,
    [id, scope.workspaceId]
  )
  if (!rowCount) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
