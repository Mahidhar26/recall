import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { requireWorkspace } from '@/lib/session'

// Powers the filter dropdowns: the meetings, speakers, and source types that
// actually exist in this workspace.
export async function GET() {
  const scope = await requireWorkspace()
  if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [meetings, people, sources] = await Promise.all([
    pool.query(
      `SELECT id, title, TO_CHAR(created_at, 'Mon DD, YYYY') AS date
       FROM meetings
       WHERE workspace_id = $1 AND status = 'ready'
       ORDER BY created_at DESC`,
      [scope.workspaceId]
    ),
    pool.query(
      `SELECT DISTINCT c.speaker
       FROM chunks c JOIN meetings m ON c.meeting_id = m.id
       WHERE m.workspace_id = $1 AND c.speaker IS NOT NULL AND c.speaker <> ''
       ORDER BY c.speaker`,
      [scope.workspaceId]
    ),
    pool.query(
      `SELECT DISTINCT source FROM meetings
       WHERE workspace_id = $1 AND status = 'ready' AND source IS NOT NULL
       ORDER BY source`,
      [scope.workspaceId]
    ),
  ])

  return NextResponse.json({
    meetings: meetings.rows,
    people: people.rows.map(r => r.speaker),
    sources: sources.rows.map(r => r.source),
  })
}
