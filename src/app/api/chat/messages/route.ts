import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { requireWorkspace } from '@/lib/session'
import { normalizeFilters } from '@/lib/chat-filters'

// Persist one message (user or assistant) to a session. The session-ownership
// check in the INSERT ... SELECT ensures a user can't write into another
// workspace's session even with a guessed id.
export async function POST(req: NextRequest) {
  const scope = await requireWorkspace()
  if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, role, content, sources, filters } = await req.json()
  if (!sessionId || (role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
  }

  const { rows } = await pool.query(
    `INSERT INTO chat_messages (session_id, role, content, sources, filters)
     SELECT $1, $2, $3, $4, $5
     WHERE EXISTS (SELECT 1 FROM chat_sessions WHERE id = $1 AND workspace_id = $6)
     RETURNING id`,
    [
      sessionId,
      role,
      content,
      JSON.stringify(Array.isArray(sources) ? sources : []),
      JSON.stringify(normalizeFilters(filters)),
      scope.workspaceId,
    ]
  )
  if (!rows.length) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  // Surface the session in History ordering on each new message.
  await pool.query(
    `UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1 AND workspace_id = $2`,
    [sessionId, scope.workspaceId]
  )

  return NextResponse.json({ id: rows[0].id })
}
