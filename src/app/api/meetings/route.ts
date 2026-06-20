import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET() {
  const meetings = await pool.query(`
    SELECT m.*,
      (SELECT COUNT(*) FROM chunks WHERE meeting_id = m.id) AS chunk_count,
      (SELECT COUNT(*) FROM action_items WHERE meeting_id = m.id) AS action_count,
      (SELECT COUNT(*) FROM decisions WHERE meeting_id = m.id) AS decision_count
    FROM meetings m
    WHERE m.status = 'ready'
    ORDER BY m.created_at DESC
  `)
  const stats = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM meetings WHERE status = 'ready') AS meeting_count,
      (SELECT COUNT(*) FROM action_items WHERE status = 'todo') AS open_actions,
      (SELECT COUNT(*) FROM decisions) AS decision_count
  `)
  return NextResponse.json({
    meetings: meetings.rows,
    stats: stats.rows[0],
  })
}
