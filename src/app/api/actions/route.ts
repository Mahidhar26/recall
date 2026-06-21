import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { requireWorkspace } from '@/lib/session'

export async function GET(req: NextRequest) {
  const scope = await requireWorkspace()
  if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status')
  const params: any[] = [scope.workspaceId]
  let sql = `SELECT a.*, m.title AS meeting_title, m.created_at AS meeting_date
       FROM action_items a JOIN meetings m ON a.meeting_id = m.id
       WHERE m.workspace_id = $1`
  if (status) {
    params.push(status)
    sql += ` AND a.status = $2`
  }
  sql += ` ORDER BY a.created_at DESC`
  const { rows } = await pool.query(sql, params)
  return NextResponse.json({ items: rows })
}

export async function PATCH(req: NextRequest) {
  const scope = await requireWorkspace()
  if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status } = await req.json()
  if (!['todo', 'inprogress', 'blocked', 'done'].includes(status))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  // The meeting join + workspace filter ensures users can only mutate their own
  // action items, even when supplying an arbitrary id.
  const { rows } = await pool.query(
    `UPDATE action_items a SET status = $1, updated_at = NOW()
     FROM meetings m
     WHERE a.id = $2 AND a.meeting_id = m.id AND m.workspace_id = $3
     RETURNING a.*`,
    [status, id, scope.workspaceId]
  )
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ item: rows[0] })
}
