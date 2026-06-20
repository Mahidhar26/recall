import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET() {
  const { rows } = await pool.query(`
    SELECT d.*, m.title AS meeting_title,
           TO_CHAR(m.created_at, 'Mon DD, YYYY') AS meeting_date
    FROM decisions d
    JOIN meetings m ON d.meeting_id = m.id
    ORDER BY d.created_at DESC
  `)
  return NextResponse.json({ decisions: rows })
}
