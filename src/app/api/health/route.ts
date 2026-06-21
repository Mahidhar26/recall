import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const result = await pool.query('SELECT NOW() as now')
    const ext = await pool.query(
      "SELECT extversion FROM pg_extension WHERE extname = 'vector'"
    )
    return NextResponse.json({
      status: 'ok',
      time: result.rows[0].now,
      pgvector: ext.rows[0]?.extversion ?? 'NOT INSTALLED',
    })
  } catch (err: any) {
    console.error('[health] DB error:', err.message, err.code, err.address, err.port)
    return NextResponse.json(
      { status: 'error', message: err.message, code: err.code },
      { status: 500 }
    )
  }
}