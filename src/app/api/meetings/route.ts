import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { requireWorkspace } from '@/lib/session'

export async function GET() {
  const scope = await requireWorkspace()
  if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const meetings = await pool.query(`
    SELECT m.*,
      (SELECT COUNT(*) FROM chunks WHERE meeting_id = m.id) AS chunk_count,
      (SELECT COUNT(*) FROM action_items WHERE meeting_id = m.id) AS action_count,
      (SELECT COUNT(*) FROM decisions WHERE meeting_id = m.id) AS decision_count
    FROM meetings m
    WHERE m.status = 'ready' AND m.workspace_id = $1
    ORDER BY m.created_at DESC
  `, [scope.workspaceId])
  const stats = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM meetings WHERE status = 'ready' AND workspace_id = $1) AS meeting_count,
      (SELECT COUNT(*) FROM action_items a JOIN meetings m ON a.meeting_id = m.id
         WHERE a.status = 'todo' AND m.workspace_id = $1) AS open_actions,
      (SELECT COUNT(*) FROM decisions d JOIN meetings m ON d.meeting_id = m.id
         WHERE m.workspace_id = $1) AS decision_count
  `, [scope.workspaceId])
  return NextResponse.json({
    meetings: meetings.rows,
    stats: stats.rows[0],
  })
}
