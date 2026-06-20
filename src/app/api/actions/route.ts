import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status')
  const sql = status
    ? `SELECT a.*, m.title AS meeting_title, m.created_at AS meeting_date
       FROM action_items a JOIN meetings m ON a.meeting_id = m.id
       WHERE a.status = $1 ORDER BY a.created_at DESC`
    : `SELECT a.*, m.title AS meeting_title, m.created_at AS meeting_date
       FROM action_items a JOIN meetings m ON a.meeting_id = m.id
       ORDER BY a.created_at DESC`
  const { rows } = await pool.query(sql, status ? [status] : [])
  return NextResponse.json({ items: rows })
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()
  if (!['todo', 'inprogress', 'blocked', 'done'].includes(status))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  const { rows } = await pool.query(
    'UPDATE action_items SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  )
  return NextResponse.json({ item: rows[0] })
}
