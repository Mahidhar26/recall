import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { requireWorkspace } from '@/lib/session'
import { normalizeFilters } from '@/lib/chat-filters'

// Create a chat session (on the first message of a fresh chat).
export async function POST(req: NextRequest) {
  const scope = await requireWorkspace()
  if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const filters = normalizeFilters(body.filters)
  // Auto-title from the first question, trimmed to a sane length.
  const raw = (body.title ?? '').toString().trim()
  const title = raw ? raw.slice(0, 80) : 'New chat'

  const { rows } = await pool.query(
    `INSERT INTO chat_sessions (title, filters, workspace_id)
     VALUES ($1, $2, $3) RETURNING id`,
    [title, JSON.stringify(filters), scope.workspaceId]
  )
  return NextResponse.json({ sessionId: rows[0].id })
}

// List sessions for the History panel, newest first.
export async function GET() {
  const scope = await requireWorkspace()
  if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows } = await pool.query(
    `SELECT s.id, s.title, s.filters,
            TO_CHAR(s.updated_at, 'Mon DD, HH24:MI') AS updated_label,
            s.updated_at,
            (SELECT COUNT(*) FROM chat_messages WHERE session_id = s.id) AS message_count,
            (SELECT content FROM chat_messages
               WHERE session_id = s.id ORDER BY created_at DESC LIMIT 1) AS last_message
     FROM chat_sessions s
     WHERE s.workspace_id = $1
     ORDER BY s.updated_at DESC
     LIMIT 100`,
    [scope.workspaceId]
  )
  return NextResponse.json({ sessions: rows })
}
