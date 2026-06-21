import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { requireWorkspace } from '@/lib/session'

export async function GET() {
  const scope = await requireWorkspace()
  if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows } = await pool.query(`
    SELECT d.*, m.title AS meeting_title,
           TO_CHAR(m.created_at, 'Mon DD, YYYY') AS meeting_date
    FROM decisions d
    JOIN meetings m ON d.meeting_id = m.id
    WHERE m.workspace_id = $1
    ORDER BY d.created_at DESC
  `, [scope.workspaceId])
  return NextResponse.json({ decisions: rows })
}
